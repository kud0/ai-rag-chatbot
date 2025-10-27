import { redirect } from 'next/navigation';

export default function AdminPage() {
  // Redirect to documents page as default
  redirect('/admin/documents');
}
