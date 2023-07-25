import { useRouter } from "next/router";

function PaymentPage() {
  const router = useRouter();
  return <p>Payment: {router.query.id}</p>;
}

export default PaymentPage;
