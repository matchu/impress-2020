import React from "react";
import {
  Box,
  Flex,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
} from "@chakra-ui/core";
import { CloseIcon, SearchIcon } from "@chakra-ui/icons";

import ItemsPanel from "./ItemsPanel";
import SearchPanel from "./SearchPanel";

/**
 * ItemsAndSearchPanels manages the shared layout and state for:
 *   - ItemsPanel, which shows the items in the outfit now, and
 *   - SearchPanel, which helps you find new items to add.
 *
 * These panels don't share a _lot_ of concerns; they're mainly intertwined by
 * the fact that they share the SearchToolbar at the top!
 *
 * We try to keep the search concerns in the search components, by avoiding
 * letting any actual _logic_ live at the root here; and instead just
 * performing some wiring to help them interact with each other via simple
 * state and refs.
 */
function ItemsAndSearchPanels({ loading, outfitState, dispatchToOutfit }) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const scrollContainerRef = React.useRef();
  const searchQueryRef = React.useRef();
  const firstSearchResultRef = React.useRef();

  return (
    <Flex direction="column" height="100%">
      <Box px="5" py="3" boxShadow="sm">
        <SearchToolbar
          query={searchQuery}
          searchQueryRef={searchQueryRef}
          firstSearchResultRef={firstSearchResultRef}
          onChange={setSearchQuery}
        />
      </Box>
      {searchQuery ? (
        <Box
          key="search-panel"
          gridArea="items"
          position="relative"
          overflow="auto"
          ref={scrollContainerRef}
        >
          <Box px="4" py="5">
            <SearchPanel
              query={searchQuery}
              outfitState={outfitState}
              dispatchToOutfit={dispatchToOutfit}
              scrollContainerRef={scrollContainerRef}
              searchQueryRef={searchQueryRef}
              firstSearchResultRef={firstSearchResultRef}
            />
          </Box>
        </Box>
      ) : (
        <Box
          gridArea="items"
          position="relative"
          overflow="auto"
          key="items-panel"
        >
          <Box px="4" py="5">
            <ItemsPanel
              loading={loading}
              outfitState={outfitState}
              dispatchToOutfit={dispatchToOutfit}
            />
          </Box>
        </Box>
      )}
    </Flex>
  );
}

/**
 * SearchToolbar is rendered above both the ItemsPanel and the SearchPanel,
 * and contains the search field where the user types their query.
 *
 * It has some subtle keyboard interaction support, like DownArrow to go to the
 * first search result, and Escape to clear the search and go back to the
 * ItemsPanel. (The SearchPanel can also send focus back to here, with Escape
 * from anywhere, or UpArrow from the first result!)
 */
function SearchToolbar({
  query,
  searchQueryRef,
  firstSearchResultRef,
  onChange,
}) {
  const onMoveFocusDownToResults = (e) => {
    if (firstSearchResultRef.current) {
      firstSearchResultRef.current.focus();
      e.preventDefault();
    }
  };

  return (
    <InputGroup>
      <InputLeftElement>
        <SearchIcon color="gray.400" />
      </InputLeftElement>
      <Input
        placeholder="Search for items to add…"
        aria-label="Search for items to add…"
        focusBorderColor="green.600"
        color="green.800"
        value={query}
        ref={searchQueryRef}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            onChange("");
            e.target.blur();
          } else if (e.key === "ArrowDown") {
            onMoveFocusDownToResults(e);
          }
        }}
      />
      {query && (
        <InputRightElement>
          <IconButton
            icon={<CloseIcon />}
            color="gray.400"
            variant="ghost"
            colorScheme="green"
            aria-label="Clear search"
            onClick={() => onChange("")}
            // Big style hacks here!
            height="calc(100% - 2px)"
            marginRight="2px"
          />
        </InputRightElement>
      )}
    </InputGroup>
  );
}

export default ItemsAndSearchPanels;
