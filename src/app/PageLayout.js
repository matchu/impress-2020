import React from "react";
import { Box } from "@chakra-ui/react";
import { loadable } from "./util";
import * as Sentry from "@sentry/react";

import { MajorErrorMessage } from "./util";

const GlobalHeader = loadable(() => import("./GlobalHeader"));
const GlobalFooter = loadable(() => import("./GlobalFooter"));

function PageLayout({ children }) {
  return (
    <Box
      paddingX="6"
      paddingY="3"
      maxWidth="1024px"
      margin="0 auto"
      minHeight="100vh"
      display="flex"
      flexDirection="column"
    >
      <Box
        width="100%"
        marginBottom="6"
        // Leave space while content is still loading
        minHeight="2rem"
      >
        <GlobalHeader />
      </Box>
      <Box flex="1 0 0">
        <Sentry.ErrorBoundary fallback={MajorErrorMessage}>
          {children}
        </Sentry.ErrorBoundary>
      </Box>
      <Box width="100%" marginTop="12">
        <GlobalFooter />
      </Box>
    </Box>
  );
}

export default PageLayout;
