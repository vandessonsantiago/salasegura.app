import { forwardRef } from 'react';
import DashboardMain, { DashboardMainRef } from './DashboardMain';

interface MainProps {
  initialMessage?: string;
  onNewMessage?: (message: string) => void;
}

const Main = forwardRef<DashboardMainRef, MainProps>(({ initialMessage, onNewMessage }, ref) => {
  return (
    <DashboardMain 
      ref={ref}
      initialMessage={initialMessage}
      onNewMessage={onNewMessage}
    />
  );
});

Main.displayName = 'Main';

export default Main;
