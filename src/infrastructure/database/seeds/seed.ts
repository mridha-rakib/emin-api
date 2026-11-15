import 'reflect-metadata';
import mongoose from 'mongoose';
import { RoleSchema } from '../../../modules/roles/schemas/role.schema';
import { SettingSchema } from '../../../modules/settings/schemas/setting.schema';
import { CategorySchema } from '../../../modules/categories/schemas/category.schema';
const roles = ['SUPER_ADMIN','ADMIN','MODERATOR','SUPPORT','FINANCE','SELLER','BUYER'];
async function main() {
  await mongoose.connect(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/emin');
  const Role = mongoose.model('Role', RoleSchema);
  const Setting = mongoose.model('Setting', SettingSchema);
  const Category = mongoose.model('Category', CategorySchema);
  for (const slug of roles) await Role.updateOne({ slug }, { $setOnInsert: { name: slug.replace('_', ' '), slug, permissions: [] } }, { upsert: true });
  for (const [key, value] of Object.entries({ 'platform.currency': 'USD', 'platform.defaultCommission': '10', 'auction.defaultMinimumIncrement': '1', 'auction.extensionSeconds': 120, 'seller.minimumWithdrawal': '25', 'order.paymentTimeoutMinutes': 30 })) await Setting.updateOne({ key }, { $setOnInsert: { key, value } }, { upsert: true });
  await Category.updateOne({ slug: 'electronics' }, { $setOnInsert: { name: 'Electronics', slug: 'electronics', attributes: [{ name: 'Brand', type: 'TEXT', required: false, filterable: true, sortOrder: 1 }], sortOrder: 1 } }, { upsert: true });
  await mongoose.disconnect();
}
void main();