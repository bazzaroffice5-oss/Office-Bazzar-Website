import { permanentRedirect } from 'next/navigation';

export default function QuoteCartRedirect() {
  permanentRedirect('/cart');
}
