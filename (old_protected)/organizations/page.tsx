import { redirect } from 'next/navigation';


export default async function OrganizationRedirectPage() {
  // Redirect to dashboard
  redirect('/dashboard');
}
