import React from "react";
import { Box, Grid, useToast } from "@chakra-ui/core";
import loadable from "@loadable/component";

import ItemsAndSearchPanels from "./ItemsAndSearchPanels";
import OutfitPreview from "../components/OutfitPreview";
import useOutfitState, { OutfitStateContext } from "./useOutfitState";
import { usePageTitle } from "../util";
import useWardrobeDevHacks from "./useWardrobeDevHacks";

const OutfitControls = loadable(() =>
  import(/* webpackPreload: true */ "./OutfitControls")
);

/**
 * WardrobePage is the most fun page on the site - it's where you create
 * outfits!
 *
 * This page has two sections: the OutfitPreview, where we show the outfit as a
 * big image; and the ItemsAndSearchPanels, which let you manage which items
 * are in the outfit and find new ones.
 *
 * This component manages shared outfit state, and the fullscreen responsive
 * page layout.
 */
function WardrobePage() {
  const toast = useToast();
  const { loading, error, outfitState, dispatchToOutfit } = useOutfitState();

  usePageTitle(`${outfitState.name || "Untitled outfit"} | Dress to Impress`);

  useWardrobeDevHacks();

  // TODO: I haven't found a great place for this error UI yet, and this case
  // isn't very common, so this lil toast notification seems good enough!
  React.useEffect(() => {
    if (error) {
      console.log(error);
      toast({
        title: "We couldn't load this outfit 😖",
        description: "Please reload the page to try again. Sorry!",
        status: "error",
        isClosable: true,
        duration: 999999999,
      });
    }
  }, [error, toast]);

  // NOTE: Most components pass around outfitState directly, to make the data
  //       relationships more explicit... but there are some deep components
  //       that need it, where it's more useful and more performant to access
  //       via context.
  return (
    <OutfitStateContext.Provider value={outfitState}>
      <Box
        position="absolute"
        top="0"
        bottom="0"
        left="0"
        right="0"
        // Create a stacking context, so that our drawers and modals don't fight
        // with the z-indexes in here!
        zIndex="0"
      >
        <Grid
          templateAreas={{
            base: `"previewAndControls"
                   "itemsAndSearch"`,
            lg: `"previewAndControls itemsAndSearch"`,
          }}
          templateRows={{
            base: "minmax(100px, 45%) minmax(300px, 55%)",
            lg: "100%",
          }}
          templateColumns={{
            base: "100%",
            lg: "50% 50%",
          }}
          height="100%"
          width="100%"
        >
          <Box gridArea="previewAndControls" bg="gray.900" pos="relative">
            <Box position="absolute" top="0" bottom="0" left="0" right="0">
              <OutfitPreview
                speciesId={outfitState.speciesId}
                colorId={outfitState.colorId}
                pose={outfitState.pose}
                wornItemIds={outfitState.wornItemIds}
              />
            </Box>
            <Box position="absolute" top="0" bottom="0" left="0" right="0">
              <OutfitControls
                outfitState={outfitState}
                dispatchToOutfit={dispatchToOutfit}
              />
            </Box>
          </Box>
          <Box gridArea="itemsAndSearch">
            <ItemsAndSearchPanels
              loading={loading}
              outfitState={outfitState}
              dispatchToOutfit={dispatchToOutfit}
            />
          </Box>
        </Grid>
      </Box>
    </OutfitStateContext.Provider>
  );
}

export default WardrobePage;