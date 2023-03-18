import { useEffect } from "react";
import ReactGA from "react-ga";

interface GoogleAnalyticsProps {
  measurementId: string;
}

const GoogleAnalytics = ({ measurementId }: GoogleAnalyticsProps) => {
  useEffect(() => {
    ReactGA.initialize(measurementId);
    ReactGA.pageview(window.location.pathname + window.location.search);
  }, [measurementId]);

  return null;
};

export default GoogleAnalytics;
