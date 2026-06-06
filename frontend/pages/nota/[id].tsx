import { Center, Spinner } from "@chakra-ui/react";
import { useRouter } from "next/router";
import NotaInfoScreen from "../../components/nota-info/NotaInfoScreen";
import { useNotaInfo } from "../../hooks/useNotaInfo";

function NotaInfoPage() {
  const router = useRouter();
  const notaId =
    router.isReady && typeof router.query.id === "string"
      ? router.query.id
      : undefined;
  const { refresh, ...data } = useNotaInfo(notaId);

  if (!router.isReady) {
    return (
      <Center minH="40vh" width="100%" maxWidth="80rem" mx="auto">
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Center alignItems="flex-start" width="100%" maxWidth="80rem" mx="auto">
      <NotaInfoScreen
        notaId={notaId ?? ""}
        data={data}
        onRefresh={refresh}
      />
    </Center>
  );
}

export default NotaInfoPage;
