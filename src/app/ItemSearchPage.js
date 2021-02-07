import React from "react";
import { Box, Flex, Wrap, WrapItem } from "@chakra-ui/react";
import gql from "graphql-tag";
import { useQuery } from "@apollo/client";
import { useHistory, useLocation, useParams } from "react-router-dom";

import SearchToolbar, {
  emptySearchQuery,
  searchQueryIsEmpty,
} from "./WardrobePage/SearchToolbar";
import SquareItemCard, {
  SquareItemCardSkeleton,
} from "./components/SquareItemCard";
import WIPCallout from "./components/WIPCallout";
import { Delay, ErrorMessage, useCommonStyles, useDebounce } from "./util";

function ItemSearchPage() {
  const [query, setQuery] = useSearchQueryInUrl();
  const { brightBackground } = useCommonStyles();

  return (
    <Box>
      <SearchToolbar
        query={query}
        onChange={setQuery}
        showItemsLabel
        background={brightBackground}
        boxShadow="md"
        autoFocus
      />
      <Box height="6" />
      <ItemSearchPageResults query={query} />
    </Box>
  );
}

/**
 * useSearchQueryInUrl provides an API like useState, but stores the search
 * query in the URL!
 */
function useSearchQueryInUrl() {
  const history = useHistory();

  const { query: value } = useParams();
  const { search } = useLocation();
  const searchParams = new URLSearchParams(search);

  const query = {
    value: value || "",
    filterToZoneLabel: searchParams.get("zone") || null,
    filterToItemKind: searchParams.get("kind") || null,
    filterToCurrentUserOwnsOrWants: searchParams.get("user") || null,
  };
  const setQuery = React.useCallback(
    (newQuery) => {
      let url = `/items/search`;

      if (newQuery.value) {
        url += "/" + encodeURIComponent(newQuery.value);
      }

      const newParams = new URLSearchParams();
      if (newQuery.filterToItemKind) {
        newParams.append("kind", newQuery.filterToItemKind);
      }
      if (newQuery.filterToZoneLabel) {
        newParams.append("zone", newQuery.filterToZoneLabel);
      }
      if (newQuery.filterToCurrentUserOwnsOrWants) {
        newParams.append("user", newQuery.filterToCurrentUserOwnsOrWants);
      }
      const search = newParams.toString();
      if (search) {
        url += "?" + search;
      }

      history.replace(url);
    },
    [history]
  );

  return [query, setQuery];
}

function ItemSearchPageResults({ query: latestQuery }) {
  // NOTE: Some of this is copied from SearchPanel... but all of this is messy
  //       enough that I'm not comfy code-sharing yet, esp since I feel like
  //       SearchPanel pagination is a bit of a mess and will need refactoring.

  // We debounce the search query, so that we don't resend a new query whenever
  // the user types anything.
  const query = useDebounce(latestQuery, 300, {
    waitForFirstPause: true,
    initialValue: emptySearchQuery,

    // When the query is empty, clear the debounced query immediately too! That
    // will give us fast feedback when the search field clears.
    forceReset: searchQueryIsEmpty(latestQuery),
  });

  // NOTE: This query should always load ~instantly, from the client cache.
  const { data: zoneData } = useQuery(gql`
    query SearchPanelZones {
      allZones {
        id
        label
      }
    }
  `);
  const allZones = zoneData?.allZones || [];
  const filterToZones = query.filterToZoneLabel
    ? allZones.filter((z) => z.label === query.filterToZoneLabel)
    : [];
  const filterToZoneIds = filterToZones.map((z) => z.id);

  const { loading, error, data } = useQuery(
    gql`
      query ItemSearchPageResults(
        $query: String!
        $itemKind: ItemKindSearchFilter
        $currentUserOwnsOrWants: OwnsOrWants
        $zoneIds: [ID!]!
      ) {
        itemSearch(
          query: $query
          itemKind: $itemKind
          currentUserOwnsOrWants: $currentUserOwnsOrWants
          zoneIds: $zoneIds
          offset: 0
          limit: 30
        ) {
          numTotalItems
          items {
            id
            name
            thumbnailUrl
          }
        }
      }
    `,
    {
      variables: {
        query: query.value,
        itemKind: query.filterToItemKind,
        currentUserOwnsOrWants: query.filterToCurrentUserOwnsOrWants,
        zoneIds: filterToZoneIds,
      },
      context: { sendAuth: true },
      skip: searchQueryIsEmpty(query),
    }
  );

  if (searchQueryIsEmpty(query)) {
    return null;
  }

  if (loading) {
    return (
      <Delay>
        <ItemSearchPageResultsLoading />
      </Delay>
    );
  }

  if (error) {
    return (
      <ErrorMessage>
        Oops, we couldn't load the search results. Check your connection and try
        again!
      </ErrorMessage>
    );
  }

  if (data.itemSearch.items.length === 0) {
    return (
      <Box>
        We couldn't find any matching items{" "}
        <span role="img" aria-label="(thinking emoji)">
          🤔
        </span>{" "}
        Try again?
      </Box>
    );
  }

  return (
    <Box>
      <Wrap justify="center" spacing="4">
        {data.itemSearch.items.map((item) => (
          <WrapItem key={item.id}>
            <SquareItemCard item={item} />
          </WrapItem>
        ))}
      </Wrap>
      {data.itemSearch.items.length >= 30 && (
        <Flex justify="center">
          <WIPCallout
            details="I wanted to get this out asap for looking up specific items! Multi-page browsing coming soon 😅"
            marginTop="6"
          >
            We only show the first 30 results for now! 😅 (
            {data.itemSearch.numTotalItems.toLocaleString()} total)
          </WIPCallout>
        </Flex>
      )}
    </Box>
  );
}

function ItemSearchPageResultsLoading() {
  return (
    <Wrap justify="center" spacing="4">
      <WrapItem>
        <SquareItemCardSkeleton />
      </WrapItem>
      <WrapItem>
        <SquareItemCardSkeleton minHeightNumLines={3} />
      </WrapItem>
      <WrapItem>
        <SquareItemCardSkeleton />
      </WrapItem>
      <WrapItem>
        <SquareItemCardSkeleton />
      </WrapItem>
      <WrapItem>
        <SquareItemCardSkeleton />
      </WrapItem>
      <WrapItem>
        <SquareItemCardSkeleton minHeightNumLines={3} />
      </WrapItem>
      <WrapItem>
        <SquareItemCardSkeleton />
      </WrapItem>
      <WrapItem>
        <SquareItemCardSkeleton minHeightNumLines={3} />
      </WrapItem>
      <WrapItem>
        <SquareItemCardSkeleton />
      </WrapItem>
      <WrapItem>
        <SquareItemCardSkeleton />
      </WrapItem>
      <WrapItem>
        <SquareItemCardSkeleton />
      </WrapItem>
      <WrapItem>
        <SquareItemCardSkeleton minHeightNumLines={3} />
      </WrapItem>
      <WrapItem>
        <SquareItemCardSkeleton />
      </WrapItem>
      <WrapItem>
        <SquareItemCardSkeleton />
      </WrapItem>
      <WrapItem>
        <SquareItemCardSkeleton />
      </WrapItem>
      <WrapItem>
        <SquareItemCardSkeleton minHeightNumLines={3} />
      </WrapItem>
      <WrapItem>
        <SquareItemCardSkeleton />
      </WrapItem>
      <WrapItem>
        <SquareItemCardSkeleton minHeightNumLines={3} />
      </WrapItem>
      <WrapItem>
        <SquareItemCardSkeleton />
      </WrapItem>
      <WrapItem>
        <SquareItemCardSkeleton />
      </WrapItem>
      <WrapItem>
        <SquareItemCardSkeleton />
      </WrapItem>
      <WrapItem>
        <SquareItemCardSkeleton minHeightNumLines={3} />
      </WrapItem>
      <WrapItem>
        <SquareItemCardSkeleton />
      </WrapItem>
      <WrapItem>
        <SquareItemCardSkeleton />
      </WrapItem>
      <WrapItem>
        <SquareItemCardSkeleton />
      </WrapItem>
      <WrapItem>
        <SquareItemCardSkeleton minHeightNumLines={3} />
      </WrapItem>
      <WrapItem>
        <SquareItemCardSkeleton />
      </WrapItem>
      <WrapItem>
        <SquareItemCardSkeleton minHeightNumLines={3} />
      </WrapItem>
      <WrapItem>
        <SquareItemCardSkeleton />
      </WrapItem>
      <WrapItem>
        <SquareItemCardSkeleton />
      </WrapItem>
    </Wrap>
  );
}

export default ItemSearchPage;
