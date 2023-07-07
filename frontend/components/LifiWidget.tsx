import { LiFiWidget } from "@lifi/widget";

export const Widget = () => {
  return (
    <LiFiWidget
      config={{
        containerStyle: {
          border: `1px solid rgb(234, 234, 234)`,
          borderRadius: "16px",
        },
      }}
      integrator="nextjs-example"
    />
  );
};
