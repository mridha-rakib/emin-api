import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { Model, Types } from 'mongoose';
import { IdentityDocumentType, IdentityStatus } from '../../common/enums/domain.enums';
import { S3StorageService } from '../../infrastructure/storage/s3-storage.service';
import { AuthService } from '../auth/auth.service';
import { User, UserDocument } from '../users/schemas/user.schema';
import { DocumentSide, IdentityVerification, IdentityVerificationDocument } from './schemas/identity-verification.schema';

export const ACCEPTED_DOCUMENTS: Array<{ type: IdentityDocumentType; label: string; requiresBack: boolean }> = [
  { type: IdentityDocumentType.SWISS_ID_CARD, label: 'Swiss national identity card', requiresBack: true },
  { type: IdentityDocumentType.SWISS_PASSPORT, label: 'Swiss passport', requiresBack: false },
  { type: IdentityDocumentType.RESIDENCE_PERMIT_B, label: 'Swiss residence permit B', requiresBack: true },
  { type: IdentityDocumentType.RESIDENCE_PERMIT_C, label: 'Swiss residence permit C', requiresBack: true },
];

export const IDENTITY_IMAGE_TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
export const MAX_IDENTITY_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_IDENTITY_REJECTIONS = 3;
const SIGNED_URL_SECONDS = 300;
const SIDE_LABEL: Record<DocumentSide, string> = {
  [DocumentSide.FRONT]: 'Front',
  [DocumentSide.BACK]: 'Back',
  [DocumentSide.SELFIE]: 'Selfie',
  [DocumentSide.LEFT]: 'Turn left',
  [DocumentSide.RIGHT]: 'Turn right',
};
const LIVENESS_SIDES = [DocumentSide.SELFIE, DocumentSide.LEFT, DocumentSide.RIGHT];

type UploadedImage = { buffer: Buffer; mimetype: string; size: number };

@Injectable()
export class IdentityVerificationService {
  constructor(
    @InjectModel(IdentityVerification.name) private readonly verifications: Model<IdentityVerificationDocument>,
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
    private readonly auth: AuthService,
    private readonly storage: S3StorageService,
  ) {}

  private requiredSides(documentType: IdentityDocumentType) {
    if (documentType === IdentityDocumentType.LIVENESS_CHECK) return LIVENESS_SIDES;
    const doc = ACCEPTED_DOCUMENTS.find((item) => item.type === documentType);
    return doc?.requiresBack ? [DocumentSide.FRONT, DocumentSide.BACK] : [DocumentSide.FRONT];
  }

  private latestFor(userId: Types.ObjectId, documentType?: IdentityDocumentType) {
    return this.verifications.findOne({ userId, ...(documentType ? { documentType } : {}) }).sort({ createdAt: -1 }).exec();
  }

  private publicItems(submission: IdentityVerificationDocument | null) {
    return (submission?.items ?? []).map((item) => ({
      side: item.side,
      status: item.status,
      rejectionReason: item.rejectionReason,
      uploadedAt: item.uploadedAt,
      reviewedAt: item.reviewedAt,
    }));
  }

  async myStatus(authorization?: string): Promise<Record<string, unknown>> {
    const user = await this.auth.requireUser(authorization);
    const latest = await this.verifications
      .findOne({ userId: user._id, documentType: { $ne: IdentityDocumentType.LIVENESS_CHECK } })
      .sort({ createdAt: -1 })
      .exec();
    const submissions = await this.verifications.find({ userId: user._id }).sort({ createdAt: -1 }).exec();
    const documents = submissions
      .filter((entry) => entry.documentType !== IdentityDocumentType.LIVENESS_CHECK)
      .map((entry) => ({
        id: entry._id,
        documentType: entry.documentType,
        status: entry.status,
        submittedAt: entry.get('createdAt') as Date | undefined,
        requiredSides: this.requiredSides(entry.documentType),
        items: this.publicItems(entry),
      }));
    const liveness = submissions.find((entry) => entry.documentType === IdentityDocumentType.LIVENESS_CHECK);
    return {
      status: user.identityStatus ?? IdentityStatus.NOT_SUBMITTED,
      rejectionReason: user.identityStatus === IdentityStatus.REJECTED ? user.identityRejectionReason : undefined,
      verifiedAt: user.identityVerifiedAt,
      submittedAt: latest?.get('createdAt') as Date | undefined,
      documentType: latest?.documentType,
      requiredSides: latest ? this.requiredSides(latest.documentType) : [],
      items: this.publicItems(latest),
      documents,
      liveness: liveness
        ? {
            id: liveness._id,
            status: liveness.status,
            submittedAt: liveness.get('createdAt') as Date | undefined,
            requiredSides: LIVENESS_SIDES,
            items: this.publicItems(liveness),
          }
        : { status: IdentityStatus.NOT_SUBMITTED, requiredSides: LIVENESS_SIDES, items: [] },
      uploadBlocked: Boolean(user.identityUploadBlockedAt),
      rejectionCount: user.identityRejectionCount ?? 0,
      maxRejections: MAX_IDENTITY_REJECTIONS,
      acceptedDocuments: ACCEPTED_DOCUMENTS,
      verification: this.auth.verificationSummary(user),
    };
  }

  /** New submission: the document type plus its front (and back, unless it is a passport). */
  async submit(
    authorization: string | undefined,
    documentType: string | undefined,
    files: { documentFront?: UploadedImage[]; documentBack?: UploadedImage[] },
  ) {
    const user = await this.auth.requireUser(authorization);
    this.assertUploadsAllowed(user);
    if (user.identityStatus === IdentityStatus.APPROVED) {
      throw new BadRequestException('Your identity is already verified.');
    }
    const document = ACCEPTED_DOCUMENTS.find((item) => item.type === documentType);
    if (!document) {
      throw new BadRequestException('Please choose an accepted document: Swiss ID card, Swiss passport, or residence permit B or C.');
    }
    const latest = await this.latestFor(user._id, document.type);
    if (latest?.status === IdentityStatus.PENDING) {
      throw new BadRequestException('This document is already being reviewed.');
    }
    const front = files.documentFront?.[0];
    const back = files.documentBack?.[0];
    if (!front) throw new BadRequestException('Please upload a photo of the front of your document.');
    if (document.requiresBack && !back) throw new BadRequestException('Please upload a photo of the back of your document.');
    [front, back].filter(Boolean).forEach((file) => this.assertImage(file!));

    const submissionId = new Types.ObjectId();
    const uploads: Array<{ side: DocumentSide; file: UploadedImage }> = [{ side: DocumentSide.FRONT, file: front }];
    if (document.requiresBack && back) uploads.push({ side: DocumentSide.BACK, file: back });

    const stored: string[] = [];
    try {
      const items = [];
      for (const upload of uploads) {
        const key = await this.storage.uploadPrivate(upload.file, this.keyFor(user._id, submissionId, upload.side, upload.file));
        stored.push(key);
        items.push({ side: upload.side, key, status: IdentityStatus.PENDING, uploadedAt: new Date() });
      }
      await this.verifications.create({ _id: submissionId, userId: user._id, documentType: document.type, items, status: IdentityStatus.PENDING });
    } catch (error) {
      await Promise.all(stored.map((key) => this.storage.deleteKey(key)));
      throw error;
    }

    await this.syncUser(user._id, IdentityStatus.PENDING);
    return this.myStatus(authorization);
  }

  /** Replaces one rejected image; the other images keep their review. */
  async resubmitItem(authorization: string | undefined, sideParam: string, file: UploadedImage | undefined) {
    const user = await this.auth.requireUser(authorization);
    this.assertUploadsAllowed(user);
    const side = this.parseSide(sideParam);
    if (!file) throw new BadRequestException('Please attach the new photo.');
    this.assertImage(file);

    const submission = await this.latestFor(user._id);
    const item = submission?.items.find((entry) => entry.side === side);
    if (!submission || !item) throw new NotFoundException('There is no document to replace.');
    if (item.status !== IdentityStatus.REJECTED) {
      throw new BadRequestException('Only a rejected photo can be replaced.');
    }

    item.key = await this.storage.uploadPrivate(file, this.keyFor(user._id, submission._id, side, file));
    item.status = IdentityStatus.PENDING;
    item.rejectionReason = undefined;
    item.reviewedAt = undefined;
    item.reviewedBy = undefined;
    item.imageDeletedAt = undefined;
    item.uploadedAt = new Date();
    await this.recompute(submission);
    return this.myStatus(authorization);
  }

  /** Uploads one side independently, creating a submission or filling/replacing one item. */
  async submitItem(
    authorization: string | undefined,
    sideParam: string,
    documentType: string | undefined,
    file: UploadedImage | undefined,
  ) {
    const user = await this.auth.requireUser(authorization);
    this.assertUploadsAllowed(user);
    if (user.identityStatus === IdentityStatus.APPROVED) {
      throw new BadRequestException('Your identity is already verified.');
    }
    const side = this.parseSide(sideParam);
    if (!file) throw new BadRequestException('Please attach the document photo.');
    this.assertImage(file);

    const document = ACCEPTED_DOCUMENTS.find((entry) => entry.type === documentType);
    if (!document) throw new BadRequestException('Please choose an accepted document.');
    if (!this.requiredSides(document.type).includes(side)) {
      throw new BadRequestException('This document only requires its photo page.');
    }

    let submission = await this.latestFor(user._id, document.type);
    if (!submission) {
      submission = await this.verifications.create({
        userId: user._id,
        documentType: document.type,
        items: [],
        status: IdentityStatus.PENDING,
      });
    }
    const existing = submission.items.find((entry) => entry.side === side);
    if (existing && existing.status !== IdentityStatus.REJECTED) {
      throw new BadRequestException(`The ${SIDE_LABEL[side].toLowerCase()} photo was already submitted.`);
    }

    const key = await this.storage.uploadPrivate(file, this.keyFor(user._id, submission._id, side, file));
    if (existing) {
      existing.key = key;
      existing.status = IdentityStatus.PENDING;
      existing.rejectionReason = undefined;
      existing.reviewedAt = undefined;
      existing.reviewedBy = undefined;
      existing.imageDeletedAt = undefined;
      existing.uploadedAt = new Date();
    } else {
      submission.items.push({ side, key, status: IdentityStatus.PENDING, uploadedAt: new Date() });
    }
    await this.recompute(submission);
    return this.myStatus(authorization);
  }

  /** Stores one frame from the active liveness challenge. All three poses are reviewed independently. */
  async submitLivenessFrame(
    authorization: string | undefined,
    poseParam: string,
    file: UploadedImage | undefined,
  ) {
    const user = await this.auth.requireUser(authorization);
    this.assertUploadsAllowed(user);
    const pose = this.parseLivenessPose(poseParam);
    if (!file) throw new BadRequestException('Please capture the requested camera frame.');
    this.assertImage(file);

    let submission = await this.latestFor(user._id, IdentityDocumentType.LIVENESS_CHECK);
    if (!submission || submission.status === IdentityStatus.APPROVED) {
      if (submission?.status === IdentityStatus.APPROVED) throw new BadRequestException('Your liveness check is already approved.');
      submission = await this.verifications.create({
        userId: user._id,
        documentType: IdentityDocumentType.LIVENESS_CHECK,
        items: [],
        status: IdentityStatus.PENDING,
      });
    }
    const existing = submission.items.find((entry) => entry.side === pose);
    if (existing && existing.status !== IdentityStatus.REJECTED) {
      throw new BadRequestException(`${SIDE_LABEL[pose]} was already captured.`);
    }
    const key = await this.storage.uploadPrivate(file, this.keyFor(user._id, submission._id, pose, file));
    if (existing) {
      existing.key = key;
      existing.status = IdentityStatus.PENDING;
      existing.rejectionReason = undefined;
      existing.reviewedAt = undefined;
      existing.reviewedBy = undefined;
      existing.imageDeletedAt = undefined;
      existing.uploadedAt = new Date();
    } else {
      submission.items.push({ side: pose, key, status: IdentityStatus.PENDING, uploadedAt: new Date() });
    }
    await this.recompute(submission);
    return this.myStatus(authorization);
  }

  async adminList(authorization: string | undefined, status: string | undefined, page = 1, limit = 25): Promise<Record<string, unknown>> {
    await this.auth.requireAdmin(authorization);
    const filter = status && Object.values(IdentityStatus).includes(status as IdentityStatus) ? { status } : {};
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const [items, total, counts] = await Promise.all([
      this.verifications
        .find(filter)
        .sort({ status: 1, updatedAt: 1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit)
        .populate('userId', 'firstName lastName email phone phoneVerifiedAt emailVerifiedAt avatar')
        .lean()
        .exec(),
      this.verifications.countDocuments(filter).exec(),
      this.verifications.aggregate<{ _id: string; count: number }>([{ $group: { _id: '$status', count: { $sum: 1 } } }]).exec(),
    ]);
    return {
      items: items.map((item) => ({
        ...item,
        items: item.items.map(({ key, ...rest }) => ({ ...rest, hasImage: Boolean(key) })),
      })),
      meta: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) },
      counts: Object.fromEntries(counts.map((row) => [row._id, row.count])),
    };
  }

  async adminDetail(authorization: string | undefined, id: string): Promise<Record<string, unknown>> {
    await this.auth.requireAdmin(authorization);
    const submission = await this.verifications
      .findById(id)
      .populate('userId', 'firstName lastName email phone phoneVerifiedAt emailVerifiedAt avatar createdAt identityRejectionCount identityUploadBlockedAt')
      .populate('items.reviewedBy', 'firstName lastName email')
      .lean()
      .exec();
    if (!submission) throw new NotFoundException('Verification not found.');

    const items = await Promise.all(
      submission.items.map(async ({ key, ...rest }) => ({
        ...rest,
        label: SIDE_LABEL[rest.side],
        hasImage: Boolean(key),
        imageUrl: key ? await this.storage.signedReadUrl(key, SIGNED_URL_SECONDS) : undefined,
      })),
    );

    return {
      ...submission,
      items,
      imageUrlExpiresInSeconds: SIGNED_URL_SECONDS,
      maxRejections: MAX_IDENTITY_REJECTIONS,
      documentLabel: ACCEPTED_DOCUMENTS.find((doc) => doc.type === submission.documentType)?.label,
    };
  }

  /** Approves or rejects a single document image. */
  async adminReviewItem(
    authorization: string | undefined,
    id: string,
    sideParam: string,
    decision: 'approve' | 'reject',
    reason?: string,
  ): Promise<Record<string, unknown>> {
    const admin = await this.auth.requireAdmin(authorization);
    const side = this.parseSide(sideParam);
    const submission = await this.verifications.findById(id).exec();
    if (!submission) throw new NotFoundException('Verification not found.');
    const item = submission.items.find((entry) => entry.side === side);
    if (!item) throw new NotFoundException('This document side was not uploaded.');
    if (item.status !== IdentityStatus.PENDING) {
      throw new BadRequestException(`This photo was already ${item.status.toLowerCase()}.`);
    }
    if (decision === 'reject' && !reason?.trim()) {
      throw new BadRequestException('Please give the user a reason for the rejection.');
    }

    item.status = decision === 'approve' ? IdentityStatus.APPROVED : IdentityStatus.REJECTED;
    item.rejectionReason = decision === 'reject' ? reason!.trim() : undefined;
    item.reviewedBy = admin._id;
    item.reviewedAt = new Date();

    // Data minimisation (Swiss FADP): once a photo is decided it is no longer needed.
    if (item.key) {
      await this.storage.deleteKey(item.key);
      item.key = undefined;
      item.imageDeletedAt = new Date();
    }

    await this.recompute(submission);
    if (decision === 'reject') {
      const updatedUser = await this.users
        .findByIdAndUpdate(submission.userId, { $inc: { identityRejectionCount: 1 } }, { new: true })
        .exec();
      if ((updatedUser?.identityRejectionCount ?? 0) >= MAX_IDENTITY_REJECTIONS && !updatedUser?.identityUploadBlockedAt) {
        await this.users.updateOne({ _id: submission.userId }, { $set: { identityUploadBlockedAt: new Date() } }).exec();
      }
    }
    return this.adminDetail(authorization, id);
  }

  async adminUnblockUploads(authorization: string | undefined, id: string): Promise<Record<string, unknown>> {
    const admin = await this.auth.requireAdmin(authorization);
    const submission = await this.verifications.findById(id).exec();
    if (!submission) throw new NotFoundException('Verification not found.');
    await this.users
      .updateOne(
        { _id: submission.userId },
        {
          $set: {
            identityRejectionCount: 0,
            identityUploadUnblockedAt: new Date(),
            identityUploadUnblockedBy: admin._id,
          },
          $unset: { identityUploadBlockedAt: 1 },
        },
      )
      .exec();
    return this.adminDetail(authorization, id);
  }

  /** Derives the submission status from its images and mirrors it on the user. */
  private async recompute(submission: IdentityVerificationDocument) {
    const required = this.requiredSides(submission.documentType);
    const relevant = submission.items.filter((item) => required.includes(item.side));
    const allApproved = required.every((side) => relevant.some((item) => item.side === side && item.status === IdentityStatus.APPROVED));
    const anyRejected = relevant.some((item) => item.status === IdentityStatus.REJECTED);

    submission.status = allApproved ? IdentityStatus.APPROVED : anyRejected ? IdentityStatus.REJECTED : IdentityStatus.PENDING;
    submission.decidedAt = submission.status === IdentityStatus.PENDING ? undefined : new Date();
    submission.markModified('items');
    await submission.save();

    const reasons = relevant
      .filter((item) => item.status === IdentityStatus.REJECTED)
      .map((item) => `${SIDE_LABEL[item.side]}: ${item.rejectionReason}`)
      .join(' · ');
    await this.syncUser(submission.userId, submission.status, reasons);
  }

  private async syncUser(userId: Types.ObjectId, _status?: IdentityStatus, _rejectionReason?: string) {
    const submissions = await this.verifications.find({ userId }).sort({ createdAt: -1 }).lean().exec();
    const documents = submissions.filter((entry) => entry.documentType !== IdentityDocumentType.LIVENESS_CHECK);
    const liveness = submissions.find((entry) => entry.documentType === IdentityDocumentType.LIVENESS_CHECK);
    const approved = documents.some((entry) => entry.status === IdentityStatus.APPROVED) && liveness?.status === IdentityStatus.APPROVED;
    const pending = submissions.some((entry) => entry.status === IdentityStatus.PENDING);
    const rejected = submissions.find((entry) => entry.status === IdentityStatus.REJECTED);
    const status = approved
      ? IdentityStatus.APPROVED
      : pending
        ? IdentityStatus.PENDING
        : rejected
          ? IdentityStatus.REJECTED
          : IdentityStatus.NOT_SUBMITTED;
    const rejectionReason = rejected?.items
      .filter((item) => item.status === IdentityStatus.REJECTED)
      .map((item) => `${SIDE_LABEL[item.side]}: ${item.rejectionReason}`)
      .join(' · ');
    const update =
      status === IdentityStatus.APPROVED
        ? { $set: { identityStatus: status, identityVerifiedAt: new Date() }, $unset: { identityRejectionReason: 1 } }
        : status === IdentityStatus.REJECTED
          ? { $set: { identityStatus: status, identityRejectionReason: rejectionReason }, $unset: { identityVerifiedAt: 1 } }
          : { $set: { identityStatus: status }, $unset: { identityRejectionReason: 1, identityVerifiedAt: 1 } };
    await this.users.updateOne({ _id: userId }, update).exec();
  }

  private parseSide(value: string) {
    const side = value?.toUpperCase() as DocumentSide;
    if (!Object.values(DocumentSide).includes(side)) {
      throw new BadRequestException('Document side must be FRONT or BACK.');
    }
    return side;
  }

  private parseLivenessPose(value: string) {
    const pose = value?.toUpperCase() as DocumentSide;
    if (!LIVENESS_SIDES.includes(pose)) {
      throw new BadRequestException('Liveness pose must be SELFIE, LEFT or RIGHT.');
    }
    return pose;
  }

  private assertUploadsAllowed(user: UserDocument) {
    if (user.identityUploadBlockedAt) {
      throw new BadRequestException('Document uploads are blocked after repeated rejections. Please contact support.');
    }
  }

  private keyFor(userId: Types.ObjectId, submissionId: Types.ObjectId, side: DocumentSide, file: UploadedImage) {
    return `identity/${userId.toString()}/${submissionId.toString()}/${side.toLowerCase()}-${randomUUID()}.${IDENTITY_IMAGE_TYPES[file.mimetype]}`;
  }

  private assertImage(file: UploadedImage) {
    if (!IDENTITY_IMAGE_TYPES[file.mimetype]) {
      throw new BadRequestException('Documents must be JPEG, PNG or WebP images.');
    }
    if (!file.size || file.size > MAX_IDENTITY_IMAGE_BYTES) {
      throw new BadRequestException('Each image must be smaller than 10 MB.');
    }
  }
}
