import * as React from "react";
import gql from "graphql-tag";
import { useQuery, useMutation } from "@apollo/client";
import { css } from "emotion";
import {
  Badge,
  Box,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  HStack,
  Link,
  Select,
  Spinner,
  Stack,
  useBreakpointValue,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/core";
import { CheckCircleIcon, EditIcon, ExternalLinkIcon } from "@chakra-ui/icons";

import ItemLayerSupportModal from "./ItemLayerSupportModal";
import Metadata, { MetadataLabel, MetadataValue } from "./Metadata";
import { OutfitLayers } from "../../components/OutfitPreview";
import useOutfitAppearance from "../../components/useOutfitAppearance";
import { OutfitStateContext } from "../useOutfitState";
import useSupportSecret from "./useSupportSecret";

/**
 * ItemSupportDrawer shows Support UI for the item when open.
 *
 * This component controls the drawer element. The actual content is imported
 * from another lazy-loaded component!
 */
function ItemSupportDrawer({ item, isOpen, onClose }) {
  const placement = useBreakpointValue({
    base: "bottom",
    lg: "right",

    // TODO: There's a bug in the Chakra RC that doesn't read the breakpoint
    // specification correctly - we need these extra keys until it's fixed!
    // https://github.com/chakra-ui/chakra-ui/issues/1444
    0: "bottom",
    1: "bottom",
    2: "right",
    3: "right",
  });

  return (
    <Drawer
      placement={placement}
      isOpen={isOpen}
      onClose={onClose}
      // blockScrollOnMount doesn't matter on our fullscreen UI, but the
      // default implementation breaks out layout somehow 🤔 idk, let's not!
      blockScrollOnMount={false}
    >
      <DrawerOverlay>
        <DrawerContent
          maxHeight={placement === "bottom" ? "90vh" : undefined}
          overflow="auto"
        >
          <DrawerCloseButton />
          <DrawerHeader>
            {item.name}
            <Badge colorScheme="pink" marginLeft="3">
              Support <span aria-hidden="true">💖</span>
            </Badge>
          </DrawerHeader>
          <DrawerBody paddingBottom="5">
            <Metadata>
              <MetadataLabel>Item ID:</MetadataLabel>
              <MetadataValue>{item.id}</MetadataValue>
            </Metadata>
            <Stack spacing="8" marginTop="6">
              <ItemSupportFields item={item} />
              <ItemSupportAppearanceLayers item={item} />
            </Stack>
          </DrawerBody>
        </DrawerContent>
      </DrawerOverlay>
    </Drawer>
  );
}

function ItemSupportFields({ item }) {
  const { loading, error, data } = useQuery(
    gql`
      query ItemSupportFields($itemId: ID!) {
        item(id: $itemId) {
          id
          manualSpecialColor {
            id
          }
          explicitlyBodySpecific
        }
      }
    `,
    {
      variables: { itemId: item.id },

      // HACK: I think it's a bug in @apollo/client 3.1.1 that, if the
      //     optimistic response sets `manualSpecialColor` to null, the query
      //     doesn't update, even though its cache has updated :/
      //
      //     This cheap trick of changing the display name every re-render
      //     persuades Apollo that this is a different query, so it re-checks
      //     its cache and finds the empty `manualSpecialColor`. Weird!
      displayName: `ItemSupportFields-${new Date()}`,
    }
  );

  const errorColor = useColorModeValue("red.500", "red.300");

  return (
    <>
      {error && <Box color={errorColor}>{error.message}</Box>}
      <ItemSupportSpecialColorFields
        loading={loading}
        error={error}
        item={item}
        manualSpecialColor={data?.item?.manualSpecialColor?.id}
      />
      <ItemSupportPetCompatibilityRuleFields
        loading={loading}
        error={error}
        item={item}
        explicitlyBodySpecific={data?.item?.explicitlyBodySpecific}
      />
    </>
  );
}

function ItemSupportSpecialColorFields({
  loading,
  error,
  item,
  manualSpecialColor,
}) {
  const supportSecret = useSupportSecret();

  const {
    loading: colorsLoading,
    error: colorsError,
    data: colorsData,
  } = useQuery(
    gql`
      query ItemSupportDrawerAllColors {
        allColors {
          id
          name
          isStandard
        }
      }
    `
  );

  const [
    mutate,
    { loading: mutationLoading, error: mutationError, data: mutationData },
  ] = useMutation(gql`
    mutation ItemSupportDrawerSetManualSpecialColor(
      $itemId: ID!
      $colorId: ID
      $supportSecret: String!
    ) {
      setManualSpecialColor(
        itemId: $itemId
        colorId: $colorId
        supportSecret: $supportSecret
      ) {
        id
        manualSpecialColor {
          id
        }
      }
    }
  `);

  const onChange = React.useCallback(
    (e) => {
      const colorId = e.target.value || null;
      const color =
        colorId != null ? { __typename: "Color", id: colorId } : null;
      mutate({
        variables: {
          itemId: item.id,
          colorId,
          supportSecret,
        },
        optimisticResponse: {
          __typename: "Mutation",
          setManualSpecialColor: {
            __typename: "Item",
            id: item.id,
            manualSpecialColor: color,
          },
        },
      }).catch((e) => {
        // Ignore errors from the promise, because we'll handle them on render!
      });
    },
    [item.id, mutate, supportSecret]
  );

  const nonStandardColors =
    colorsData?.allColors?.filter((c) => !c.isStandard) || [];
  nonStandardColors.sort((a, b) => a.name.localeCompare(b.name));

  const linkColor = useColorModeValue("green.500", "green.300");

  return (
    <FormControl isInvalid={Boolean(error || colorsError || mutationError)}>
      <FormLabel>Special color</FormLabel>
      <Select
        placeholder={
          loading || colorsLoading
            ? "Loading…"
            : "Default: Auto-detect from item description"
        }
        value={manualSpecialColor?.id}
        isDisabled={mutationLoading}
        icon={
          loading || colorsLoading || mutationLoading ? (
            <Spinner />
          ) : mutationData ? (
            <CheckCircleIcon />
          ) : undefined
        }
        onChange={onChange}
      >
        {nonStandardColors.map((color) => (
          <option key={color.id} value={color.id}>
            {color.name}
          </option>
        ))}
      </Select>
      {colorsError && (
        <FormErrorMessage>{colorsError.message}</FormErrorMessage>
      )}
      {mutationError && (
        <FormErrorMessage>{mutationError.message}</FormErrorMessage>
      )}
      {!colorsError && !mutationError && (
        <FormHelperText>
          This controls which previews we show on the{" "}
          <Link
            href={`https://impress.openneo.net/items/${
              item.id
            }-${item.name.replace(/ /g, "-")}`}
            color={linkColor}
            isExternal
          >
            item page <ExternalLinkIcon />
          </Link>
          .
        </FormHelperText>
      )}
    </FormControl>
  );
}

function ItemSupportPetCompatibilityRuleFields({
  loading,
  error,
  item,
  explicitlyBodySpecific,
}) {
  const supportSecret = useSupportSecret();

  const [
    mutate,
    { loading: mutationLoading, error: mutationError, data: mutationData },
  ] = useMutation(gql`
    mutation ItemSupportDrawerSetItemExplicitlyBodySpecific(
      $itemId: ID!
      $explicitlyBodySpecific: Boolean!
      $supportSecret: String!
    ) {
      setItemExplicitlyBodySpecific(
        itemId: $itemId
        explicitlyBodySpecific: $explicitlyBodySpecific
        supportSecret: $supportSecret
      ) {
        id
        explicitlyBodySpecific
      }
    }
  `);

  const onChange = React.useCallback(
    (e) => {
      const explicitlyBodySpecific = e.target.value === "true";
      mutate({
        variables: {
          itemId: item.id,
          explicitlyBodySpecific,
          supportSecret,
        },
        optimisticResponse: {
          __typename: "Mutation",
          setItemExplicitlyBodySpecific: {
            __typename: "Item",
            id: item.id,
            explicitlyBodySpecific,
          },
        },
      }).catch((e) => {
        // Ignore errors from the promise, because we'll handle them on render!
      });
    },
    [item.id, mutate, supportSecret]
  );

  return (
    <FormControl isInvalid={Boolean(error || mutationError)}>
      <FormLabel>Pet compatibility rule</FormLabel>
      <Select
        value={explicitlyBodySpecific ? "true" : "false"}
        isDisabled={mutationLoading}
        icon={
          loading || mutationLoading ? (
            <Spinner />
          ) : mutationData ? (
            <CheckCircleIcon />
          ) : undefined
        }
        onChange={onChange}
      >
        {loading ? (
          <option>Loading…</option>
        ) : (
          <>
            <option value="false">
              Default: Auto-detect whether this fits all pets
            </option>
            <option value="true">
              Body specific: Always different for each pet body
            </option>
          </>
        )}
      </Select>
      {mutationError && (
        <FormErrorMessage>{mutationError.message}</FormErrorMessage>
      )}
      {!mutationError && (
        <FormHelperText>
          By default, we assume Background-y zones fit all pets the same. When
          items don't follow that rule, we can override it.
        </FormHelperText>
      )}
    </FormControl>
  );
}

/**
 * NOTE: This component takes `outfitState` from context, rather than as a prop
 *       from its parent, for performance reasons. We want `Item` to memoize
 *       and generally skip re-rendering on `outfitState` changes, and to make
 *       sure the context isn't accessed when the drawer is closed. So we use
 *       it here, only when the drawer is open!
 */
function ItemSupportAppearanceLayers({ item }) {
  const outfitState = React.useContext(OutfitStateContext);
  const { speciesId, colorId, pose } = outfitState;
  const { error, visibleLayers } = useOutfitAppearance({
    speciesId,
    colorId,
    pose,
    wornItemIds: [item.id],
  });

  const biologyLayers = visibleLayers.filter((l) => l.source === "pet");
  const itemLayers = visibleLayers.filter((l) => l.source === "item");
  itemLayers.sort((a, b) => a.zone.depth - b.zone.depth);

  return (
    <FormControl>
      <FormLabel>Appearance layers</FormLabel>
      <HStack spacing="4" overflow="auto" paddingX="1">
        {itemLayers.map((itemLayer) => (
          <ItemSupportAppearanceLayer
            key={itemLayer.id}
            item={item}
            itemLayer={itemLayer}
            biologyLayers={biologyLayers}
            outfitState={outfitState}
          />
        ))}
      </HStack>
      {error && <FormErrorMessage>{error.message}</FormErrorMessage>}
    </FormControl>
  );
}

function ItemSupportAppearanceLayer({
  item,
  itemLayer,
  biologyLayers,
  outfitState,
}) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const iconButtonBgColor = useColorModeValue("green.100", "green.300");
  const iconButtonColor = useColorModeValue("green.800", "gray.900");

  return (
    <Box
      as="button"
      width="150px"
      textAlign="center"
      fontSize="xs"
      onClick={onOpen}
    >
      <Box
        width="150px"
        height="150px"
        marginBottom="1"
        boxShadow="md"
        borderRadius="md"
        position="relative"
      >
        <OutfitLayers visibleLayers={[...biologyLayers, itemLayer]} />
        <Box
          className={css`
            opacity: 0;
            transition: opacity 0.2s;

            button:hover &,
            button:focus & {
              opacity: 1;
            }

            /* On touch devices, always show the icon, to clarify that this is
             * an interactable object! (Whereas I expect other devices to
             * discover things by exploratory hover or focus!) */
            @media (hover: none) {
              opacity: 1;
            }
          `}
          background={iconButtonBgColor}
          color={iconButtonColor}
          borderRadius="full"
          boxShadow="sm"
          position="absolute"
          bottom="2"
          right="2"
          padding="2"
          alignItems="center"
          justifyContent="center"
          width="32px"
          height="32px"
        >
          <EditIcon
            boxSize="16px"
            position="relative"
            top="-2px"
            right="-1px"
          />
        </Box>
      </Box>
      <Box fontWeight="bold">{itemLayer.zone.label}</Box>
      <Box>Zone ID: {itemLayer.zone.id}</Box>
      <Box>DTI ID: {itemLayer.id}</Box>
      <ItemLayerSupportModal
        item={item}
        itemLayer={itemLayer}
        outfitState={outfitState}
        isOpen={isOpen}
        onClose={onClose}
      />
    </Box>
  );
}

export default ItemSupportDrawer;