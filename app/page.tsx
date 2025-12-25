import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to /en (middleware will handle language detection)
  redirect('/en');
}
