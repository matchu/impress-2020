import * as React from "react";
import gql from "graphql-tag";
import { useMutation } from "@apollo/client";
import {
  Button,
  Box,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Radio,
  RadioGroup,
  Spinner,
  useDisclosure,
  useToast,
} from "@chakra-ui/core";
import { ChevronRightIcon, ExternalLinkIcon } from "@chakra-ui/icons";

import ItemLayerSupportUploadModal from "./ItemLayerSupportUploadModal";
import Metadata, { MetadataLabel, MetadataValue } from "./Metadata";
import { OutfitLayers } from "../../components/OutfitPreview";
import SpeciesColorPicker from "../../components/SpeciesColorPicker";
import useOutfitAppearance, {
  itemAppearanceFragment,
} from "../../components/useOutfitAppearance";
import useSupportSecret from "./useSupportSecret";

/**
 * ItemLayerSupportModal offers Support info and tools for a specific item
 * appearance layer. Open it by clicking a layer from ItemSupportDrawer.
 */
function ItemLayerSupportModal({
  item,
  itemLayer,
  outfitState,
  isOpen,
  onClose,
}) {
  const [selectedBodyId, setSelectedBodyId] = React.useState(itemLayer.bodyId);
  const [previewBiology, setPreviewBiology] = React.useState({
    speciesId: outfitState.speciesId,
    colorId: outfitState.colorId,
    pose: outfitState.pose,
    isValid: true,
  });
  const [uploadModalIsOpen, setUploadModalIsOpen] = React.useState(false);
  const supportSecret = useSupportSecret();
  const toast = useToast();

  const [
    mutate,
    { loading: mutationLoading, error: mutationError },
  ] = useMutation(
    gql`
      mutation ItemSupportSetLayerBodyId(
        $layerId: ID!
        $bodyId: ID!
        $supportSecret: String!
        $outfitSpeciesId: ID!
        $outfitColorId: ID!
        $formPreviewSpeciesId: ID!
        $formPreviewColorId: ID!
      ) {
        setLayerBodyId(
          layerId: $layerId
          bodyId: $bodyId
          supportSecret: $supportSecret
        ) {
          # This mutation returns the affected AppearanceLayer. Fetch the
          # updated fields, including the appearance on the outfit pet and the
          # form preview pet, to automatically update our cached appearance in
          # the rest of the app. That means you should be able to see your
          # changes immediately!
          id
          bodyId
          item {
            id
            appearanceOnOutfit: appearanceOn(
              speciesId: $outfitSpeciesId
              colorId: $outfitColorId
            ) {
              ...ItemAppearanceForOutfitPreview
            }

            appearanceOnFormPreviewPet: appearanceOn(
              speciesId: $formPreviewSpeciesId
              colorId: $formPreviewColorId
            ) {
              ...ItemAppearanceForOutfitPreview
            }
          }
        }
      }
      ${itemAppearanceFragment}
    `,
    {
      variables: {
        layerId: itemLayer.id,
        bodyId: selectedBodyId,
        supportSecret,
        outfitSpeciesId: outfitState.speciesId,
        outfitColorId: outfitState.colorId,
        formPreviewSpeciesId: previewBiology.speciesId,
        formPreviewColorId: previewBiology.colorId,
      },
      onCompleted: () => {
        onClose();
        toast({
          status: "success",
          title: `Saved layer ${itemLayer.id}: ${item.name}`,
        });
      },
    }
  );

  return (
    <Modal size="xl" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay>
        <ModalContent>
          <ModalHeader>
            Layer {itemLayer.id}: {item.name}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Metadata>
              <MetadataLabel>DTI ID:</MetadataLabel>
              <MetadataValue>{itemLayer.id}</MetadataValue>
              <MetadataLabel>Neopets ID:</MetadataLabel>
              <MetadataValue>{itemLayer.remoteId}</MetadataValue>
              <MetadataLabel>Zone:</MetadataLabel>
              <MetadataValue>
                {itemLayer.zone.label} ({itemLayer.zone.id})
              </MetadataValue>
              <MetadataLabel>Assets:</MetadataLabel>
              <MetadataValue>
                <HStack spacing="2">
                  {itemLayer.svgUrl ? (
                    <Button
                      as="a"
                      size="xs"
                      target="_blank"
                      href={itemLayer.svgUrl}
                      colorScheme="teal"
                    >
                      SVG <ExternalLinkIcon ml="1" />
                    </Button>
                  ) : (
                    <Button size="xs" isDisabled>
                      No SVG
                    </Button>
                  )}
                  {itemLayer.imageUrl ? (
                    <Button
                      as="a"
                      size="xs"
                      target="_blank"
                      href={itemLayer.imageUrl}
                      colorScheme="teal"
                    >
                      PNG <ExternalLinkIcon ml="1" />
                    </Button>
                  ) : (
                    <Button size="xs" isDisabled>
                      No PNG
                    </Button>
                  )}
                  <Button
                    as="a"
                    size="xs"
                    target="_blank"
                    href={itemLayer.swfUrl}
                    colorScheme="teal"
                  >
                    SWF <ExternalLinkIcon ml="1" />
                  </Button>
                  <Box flex="1 1 0" />
                  <Button
                    size="xs"
                    colorScheme="gray"
                    onClick={() => setUploadModalIsOpen(true)}
                  >
                    Upload PNG <ChevronRightIcon />
                  </Button>
                  <ItemLayerSupportUploadModal
                    item={item}
                    itemLayer={itemLayer}
                    isOpen={uploadModalIsOpen}
                    onClose={() => setUploadModalIsOpen(false)}
                  />
                </HStack>
              </MetadataValue>
            </Metadata>
            <Box height="8" />
            <ItemLayerSupportPetCompatibilityFields
              item={item}
              itemLayer={itemLayer}
              outfitState={outfitState}
              selectedBodyId={selectedBodyId}
              previewBiology={previewBiology}
              onChangeBodyId={setSelectedBodyId}
              onChangePreviewBiology={setPreviewBiology}
            />
          </ModalBody>
          <ModalFooter>
            <ItemLayerSupportModalRemoveButton
              item={item}
              itemLayer={itemLayer}
              outfitState={outfitState}
              onRemoveSuccess={onClose}
            />
            <Box flex="1 0 0" />
            {mutationError && (
              <Box
                color="red.400"
                fontSize="sm"
                marginLeft="8"
                marginRight="2"
                textAlign="right"
              >
                {mutationError.message}
              </Box>
            )}
            <Button
              isLoading={mutationLoading}
              colorScheme="green"
              onClick={mutate}
              flex="0 0 auto"
            >
              Save changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
}

function ItemLayerSupportPetCompatibilityFields({
  item,
  itemLayer,
  outfitState,
  selectedBodyId,
  previewBiology,
  onChangeBodyId,
  onChangePreviewBiology,
}) {
  const [selectedBiology, setSelectedBiology] = React.useState(previewBiology);

  const {
    loading,
    error,
    visibleLayers,
    bodyId: appearanceBodyId,
  } = useOutfitAppearance({
    speciesId: previewBiology.speciesId,
    colorId: previewBiology.colorId,
    pose: previewBiology.pose,
    wornItemIds: [item.id],
  });

  const biologyLayers = visibleLayers.filter((l) => l.source === "pet");

  // After we touch a species/color selector and null out `bodyId`, when the
  // appearance body ID loads in, select it as the new body ID.
  //
  // This might move the radio button away from "all pets", but I think that's
  // a _less_ surprising experience: if you're touching the pickers, then
  // that's probably where you head is.
  React.useEffect(() => {
    if (selectedBodyId == null && appearanceBodyId != null) {
      onChangeBodyId(appearanceBodyId);
    }
  }, [selectedBodyId, appearanceBodyId, onChangeBodyId]);

  return (
    <FormControl isInvalid={error || !selectedBiology.isValid ? true : false}>
      <FormLabel>Pet compatibility</FormLabel>
      <RadioGroup
        colorScheme="green"
        value={selectedBodyId}
        onChange={(newBodyId) => onChangeBodyId(newBodyId)}
        marginBottom="4"
      >
        <Radio value="0">
          Fits all pets{" "}
          <Box display="inline" color="gray.400" fontSize="sm">
            (Body ID: 0)
          </Box>
        </Radio>
        <Radio as="div" value={appearanceBodyId} marginTop="2">
          Fits all pets with the same body as:{" "}
          <Box display="inline" color="gray.400" fontSize="sm">
            (Body ID:{" "}
            {appearanceBodyId == null ? (
              <Spinner size="sm" />
            ) : (
              appearanceBodyId
            )}
            )
          </Box>
        </Radio>
      </RadioGroup>
      <Box display="flex" flexDirection="column" alignItems="center">
        <Box
          width="150px"
          height="150px"
          marginTop="2"
          marginBottom="2"
          boxShadow="md"
          borderRadius="md"
        >
          <OutfitLayers
            loading={loading}
            visibleLayers={[...biologyLayers, itemLayer]}
          />
        </Box>
        <SpeciesColorPicker
          speciesId={selectedBiology.speciesId}
          colorId={selectedBiology.colorId}
          idealPose={outfitState.pose}
          size="sm"
          showPlaceholders
          onChange={(species, color, isValid, pose) => {
            const speciesId = species.id;
            const colorId = color.id;

            setSelectedBiology({ speciesId, colorId, isValid, pose });
            if (isValid) {
              onChangePreviewBiology({ speciesId, colorId, isValid, pose });

              // Also temporarily null out the body ID. We'll switch to the new
              // body ID once it's loaded.
              onChangeBodyId(null);
            }
          }}
        />
        <Box height="1" />
        {!error && (
          <FormHelperText>
            If it doesn't look right, try some other options until it does!
          </FormHelperText>
        )}
        {error && <FormErrorMessage>{error.message}</FormErrorMessage>}
      </Box>
    </FormControl>
  );
}

function ItemLayerSupportModalRemoveButton({
  item,
  itemLayer,
  outfitState,
  onRemoveSuccess,
}) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const supportSecret = useSupportSecret();

  const [mutate, { loading, error }] = useMutation(
    gql`
      mutation ItemLayerSupportRemoveButton(
        $layerId: ID!
        $itemId: ID!
        $outfitSpeciesId: ID!
        $outfitColorId: ID!
        $supportSecret: String!
      ) {
        removeLayerFromItem(
          layerId: $layerId
          itemId: $itemId
          supportSecret: $supportSecret
        ) {
          # This mutation returns the affected layer, and the affected item.
          # Fetch the updated appearance for the current outfit, which should
          # no longer include this layer. This means you should be able to see
          # your changes immediately!
          item {
            id
            appearanceOn(speciesId: $outfitSpeciesId, colorId: $outfitColorId) {
              ...ItemAppearanceForOutfitPreview
            }
          }

          # The layer's item should be null now, fetch to confirm and update!
          layer {
            id
            item {
              id
            }
          }
        }
      }
      ${itemAppearanceFragment}
    `,
    {
      variables: {
        layerId: itemLayer.id,
        itemId: item.id,
        outfitSpeciesId: outfitState.speciesId,
        outfitColorId: outfitState.colorId,
        supportSecret,
      },
      onCompleted: () => {
        onClose();
        onRemoveSuccess();
        toast({
          status: "success",
          title: `Removed layer ${itemLayer.id} from ${item.name}`,
        });
      },
    }
  );

  return (
    <>
      <Button colorScheme="red" flex="0 0 auto" onClick={onOpen}>
        Remove
      </Button>
      <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
        <ModalOverlay>
          <ModalContent>
            <ModalCloseButton />
            <ModalHeader>
              Remove Layer {itemLayer.id} ({itemLayer.zone.label}) from{" "}
              {item.name}?
            </ModalHeader>
            <ModalBody>
              <Box as="p" marginBottom="4">
                This will permanently-ish remove Layer {itemLayer.id} (
                {itemLayer.zone.label}) from this item.
              </Box>
              <Box as="p" marginBottom="4">
                If you remove a correct layer by mistake, re-modeling should fix
                it, or Matchu can restore it if you write down the layer ID
                before proceeding!
              </Box>
              <Box as="p" marginBottom="4">
                Are you sure you want to remove Layer {itemLayer.id} from this
                item?
              </Box>
            </ModalBody>
            <ModalFooter>
              <Button flex="0 0 auto" onClick={onClose}>
                Close
              </Button>
              <Box flex="1 0 0" />
              {error && (
                <Box
                  color="red.400"
                  fontSize="sm"
                  marginLeft="8"
                  marginRight="2"
                  textAlign="right"
                >
                  {error.message}
                </Box>
              )}
              <Button
                colorScheme="red"
                flex="0 0 auto"
                onClick={() =>
                  mutate().catch((e) => {
                    /* Discard errors here; we'll show them in the UI! */
                  })
                }
                isLoading={loading}
              >
                Yes, remove permanently
              </Button>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      </Modal>
    </>
  );
}

export default ItemLayerSupportModal;