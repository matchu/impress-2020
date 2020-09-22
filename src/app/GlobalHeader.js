import React from "react";
import {
  Box,
  Button,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useBreakpointValue,
} from "@chakra-ui/core";
import { HamburgerIcon } from "@chakra-ui/icons";
import { Link, useLocation } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { ChevronLeftIcon } from "@chakra-ui/icons";

import useCurrentUser from "./components/useCurrentUser";

import HomeLinkIcon from "../images/home-link-icon.png";
import HomeLinkIcon2x from "../images/home-link-icon@2x.png";

function GlobalHeader() {
  return (
    <Box display="flex" alignItems="center" flexWrap="wrap">
      <HomeLink marginRight="2" />
      <Box marginLeft="auto">
        <UserNavBarSection />
      </Box>
    </Box>
  );
}

function HomeLink(props) {
  const { pathname } = useLocation();
  const isHomePage = pathname === "/";

  return (
    <Box
      as={Link}
      to="/"
      display="flex"
      alignItems="center"
      role="group"
      {...props}
    >
      <Box
        display="flex"
        alignItems="center"
        marginRight="2"
        position="relative"
        transition="all 0.2s"
        opacity="0.8"
        _groupHover={{ transform: "scale(1.1)", opacity: "1" }}
        _groupFocus={{ transform: "scale(1.1)", opacity: "1" }}
      >
        <Box
          position="absolute"
          right="100%"
          opacity={isHomePage ? "0" : "1"}
          transform={isHomePage ? "translateX(3px)" : "none"}
          transition="all 0.2s"
        >
          <ChevronLeftIcon />
        </Box>
        <Box
          as="img"
          src={HomeLinkIcon}
          srcSet={`${HomeLinkIcon} 1x, ${HomeLinkIcon2x} 2x`}
          alt=""
          height="2em"
          width="2em"
          borderRadius="lg"
          boxShadow="md"
        />
        <Box
          height="2em"
          width="2em"
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          borderRadius="lg"
          transition="border 0.2s"
        />
      </Box>
      <Box
        fontFamily="Delicious"
        fontWeight="600"
        fontSize="2xl"
        display={{ base: "none", sm: "block" }}
        opacity={isHomePage ? "0" : "1"}
        transition="all 0.2s"
        marginRight="2"
        _groupHover={{ fontWeight: "900" }}
        _groupFocus={{ fontWeight: "900" }}
      >
        Dress to Impress
      </Box>
    </Box>
  );
}

function UserNavBarSection() {
  const { isLoading, isAuthenticated, loginWithRedirect, logout } = useAuth0();
  const { id, username } = useCurrentUser();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return (
      <HStack align="center" spacing="2">
        {username && (
          <Box fontSize="sm" textAlign="right">
            Hi, {username}!
          </Box>
        )}
        <NavLinksList>
          {id && (
            <NavLinkItem as={Link} to={`/user/${id}/items`}>
              Items
            </NavLinkItem>
          )}
          <NavLinkItem as={Link} to="/modeling">
            Modeling
          </NavLinkItem>
        </NavLinksList>
        <NavButton onClick={() => logout({ returnTo: window.location.origin })}>
          Log out
        </NavButton>
      </HStack>
    );
  } else {
    return (
      <HStack align="center" spacing="2">
        <NavButton as={Link} to="/modeling">
          Modeling
        </NavButton>
        <NavButton onClick={() => loginWithRedirect()}>Log in</NavButton>
      </HStack>
    );
  }
}

function NavLinksList({ children }) {
  const navStyle = useBreakpointValue({ base: "menu", md: "buttons" });

  if (navStyle === "menu") {
    return (
      <Menu>
        <MenuButton>
          <NavButton icon={<HamburgerIcon />} />
        </MenuButton>
        <MenuList>{children}</MenuList>
      </Menu>
    );
  } else {
    return children;
  }
}

function NavLinkItem(props) {
  const navStyle = useBreakpointValue({ base: "menu", md: "buttons" });

  if (navStyle === "menu") {
    return <MenuItem {...props} />;
  } else {
    return <NavButton {...props} />;
  }
}

const NavButton = React.forwardRef(({ icon, ...props }, ref) => {
  const Component = icon ? IconButton : Button;

  // Opacity is in a separate Box, to avoid overriding the built-in Button
  // hover/focus states.
  return (
    <Box
      opacity="0.8"
      _hover={{ opacity: "1" }}
      _focusWithin={{ opacity: "1" }}
    >
      <Component size="sm" variant="outline" icon={icon} ref={ref} {...props} />
    </Box>
  );
});

export default GlobalHeader;