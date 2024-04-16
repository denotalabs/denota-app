import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { NextPage } from 'next';

const Home: NextPage = () => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        padding: 12,
      }}
    >
      <ConnectButton 
      accountStatus={{
        smallScreen: 'avatar',
        largeScreen: 'full',
      }}
      />
    </div>
  );
};

export default Home;
