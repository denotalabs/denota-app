import { useRouter } from "next/router";
import { ReactNode, useEffect } from "react";

interface Props {
  children: ReactNode;
}

export default function ProtectedPage({ children }: Props) {
  const router = useRouter();

  useEffect(() => {
    // TODO: check token expiry
    if (!localStorage.getItem("token")) {
      router.push("/login");
    }
  }, [router]);

  return <>{children}</>;
}
