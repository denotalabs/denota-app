import { useRouter } from "next/router";

function UserPage() {
  const router = useRouter();
  return <p>User: {router.query.id}</p>;
}

export default UserPage;
