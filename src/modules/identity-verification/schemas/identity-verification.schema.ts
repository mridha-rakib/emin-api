import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { IdentityDocumentType, IdentityStatus } from '../../../common/enums/domain.enums';

export type IdentityVerificationDocument = HydratedDocument<IdentityVerification>;

export enum DocumentSide {
  FRONT = 'FRONT',
  BACK = 'BACK',
  SELFIE = 'SELFIE',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

type ReviewStatus = IdentityStatus.PENDING | IdentityStatus.APPROVED | IdentityStatus.REJECTED;
const REVIEW_STATUSES = [IdentityStatus.PENDING, IdentityStatus.APPROVED, IdentityStatus.REJECTED];

/** One uploaded document image. Each image is reviewed on its own; the image is deleted once it has been decided. */
@Schema({ _id: false, versionKey: false })
export class IdentityDocumentItem {
  @Prop({ enum: DocumentSide, required: true }) side: DocumentSide;
  @Prop() key?: string;
  @Prop({ enum: REVIEW_STATUSES, default: IdentityStatus.PENDING }) status: ReviewStatus;
  @Prop() rejectionReason?: string;
  @Prop({ required: true }) uploadedAt: Date;
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' }) reviewedBy?: Types.ObjectId;
  @Prop() reviewedAt?: Date;
  @Prop() imageDeletedAt?: Date;
}
export const IdentityDocumentItemSchema = SchemaFactory.createForClass(IdentityDocumentItem);

/**
 * One identity check: the document type and its images. Only what is needed for the decision is kept;
 * the overall status is derived from the individual image reviews.
 */
@Schema({ timestamps: true, versionKey: false, collection: 'identityVerifications' })
export class IdentityVerification {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true }) userId: Types.ObjectId;
  @Prop({ enum: IdentityDocumentType, required: true }) documentType: IdentityDocumentType;
  @Prop({ type: [IdentityDocumentItemSchema], default: [] }) items: IdentityDocumentItem[];
  @Prop({ enum: REVIEW_STATUSES, default: IdentityStatus.PENDING, index: true }) status: ReviewStatus;
  @Prop() decidedAt?: Date;
}

export const IdentityVerificationSchema = SchemaFactory.createForClass(IdentityVerification);
IdentityVerificationSchema.index({ status: 1, createdAt: 1 });
