import React, { useEffect } from "react";
import ReactGA from "react-ga";

interface GoogleAnalyticsProps {
  measurementId: string;
}

const GoogleAnalytics: React.FC<GoogleAnalyticsProps> = ({ measurementId }) => {
  useEffect(() => {
    ReactGA.initialize(measurementId);
    ReactGA.pageview(window.location.pathname + window.location.search);
  }, [measurementId]);

  return null;
};

export default GoogleAnalytics;
