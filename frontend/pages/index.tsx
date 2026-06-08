import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: "/send",
      permanent: false,
    },
  };
};

function HomePage() {
  return null;
}

export default HomePage;
