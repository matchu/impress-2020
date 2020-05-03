import React from "react";
import gql from "graphql-tag";
import { useQuery } from "@apollo/react-hooks";
import { css, cx } from "emotion";
import {
  Box,
  Button,
  Flex,
  Image,
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
  VisuallyHidden,
  useTheme,
} from "@chakra-ui/core";

import { getVisibleLayers, petAppearanceFragment } from "./useOutfitAppearance";

// From https://twemoji.twitter.com/, thank you!
import twemojiSmile from "../images/twemoji/smile.svg";
import twemojiCry from "../images/twemoji/cry.svg";
import twemojiSick from "../images/twemoji/sick.svg";
import twemojiMasc from "../images/twemoji/masc.svg";
import twemojiFem from "../images/twemoji/fem.svg";
import { OutfitLayers } from "./OutfitPreview";

function PosePicker({ outfitState, onLockFocus, onUnlockFocus }) {
  const theme = useTheme();

  const { speciesId, colorId } = outfitState;
  const { loading, error, poses, selectPose } = usePoses({
    speciesId,
    colorId,
  });

  const checkedInputRef = React.useRef();

  if (loading) {
    return null;
  }

  // This is a low-stakes enough control, where enough pairs don't have data
  // anyway, that I think I want to just not draw attention to failures.
  if (error) {
    return null;
  }

  // If there's only one pose anyway, don't bother showing a picker!
  const numAvailablePoses = Object.values(poses).filter((p) => p).length;
  if (numAvailablePoses <= 1) {
    return null;
  }

  return (
    <Popover
      placement="bottom-end"
      usePortal
      onOpen={onLockFocus}
      onClose={onUnlockFocus}
      initialFocusRef={checkedInputRef}
    >
      {({ isOpen }) => (
        <>
          <PopoverTrigger>
            <Button
              variant="unstyled"
              boxShadow="md"
              d="flex"
              alignItems="center"
              justifyContent="center"
              _focus={{ borderColor: "gray.50" }}
              _hover={{ borderColor: "gray.50" }}
              outline="initial"
              className={cx(
                css`
                  border: 1px solid transparent !important;
                  transition: border-color 0.2s !important;

                  &:focus,
                  &:hover,
                  &.is-open {
                    border-color: ${theme.colors.gray["50"]} !important;
                  }

                  &.is-open {
                    border-width: 2px !important;
                  }
                `,
                isOpen && "is-open"
              )}
            >
              <EmojiImage src={twemojiSmile} aria-label="Choose a pose" />
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <Box p="4">
              <table
                width="100%"
                borderSpacing="8px"
                onChange={(e) => {
                  const [emotion, genderPresentation] = e.target.value.split(
                    "-"
                  );
                  selectPose({ emotion, genderPresentation });
                }}
              >
                <thead>
                  <tr>
                    <th />
                    <Cell as="th">
                      <EmojiImage src={twemojiSmile} aria-label="Happy" />
                    </Cell>
                    <Cell as="th">
                      <EmojiImage src={twemojiCry} aria-label="Sad" />
                    </Cell>
                    <Cell as="th">
                      <EmojiImage src={twemojiSick} aria-label="Sick" />
                    </Cell>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <Cell as="th">
                      <EmojiImage src={twemojiMasc} aria-label="Masculine" />
                    </Cell>
                    <Cell as="td">
                      <PoseButton
                        pose={poses.happyMasc}
                        speciesId={speciesId}
                        inputRef={poses.happyMasc.isSelected && checkedInputRef}
                      />
                    </Cell>
                    <Cell as="td">
                      <PoseButton
                        pose={poses.sadMasc}
                        speciesId={speciesId}
                        inputRef={poses.sadMasc.isSelected && checkedInputRef}
                      />
                    </Cell>
                    <Cell as="td">
                      <PoseButton
                        pose={poses.sickMasc}
                        speciesId={speciesId}
                        inputRef={poses.sickMasc.isSelected && checkedInputRef}
                      />
                    </Cell>
                  </tr>
                  <tr>
                    <Cell as="th">
                      <EmojiImage src={twemojiFem} aria-label="Feminine" />
                    </Cell>
                    <Cell as="td">
                      <PoseButton
                        pose={poses.happyFem}
                        speciesId={speciesId}
                        inputRef={poses.happyFem.isSelected && checkedInputRef}
                      />
                    </Cell>
                    <Cell as="td">
                      <PoseButton
                        pose={poses.sadFem}
                        speciesId={speciesId}
                        inputRef={poses.sadFem.isSelected && checkedInputRef}
                      />
                    </Cell>
                    <Cell as="td">
                      <PoseButton
                        pose={poses.sickFem}
                        speciesId={speciesId}
                        inputRef={poses.sickFem.isSelected && checkedInputRef}
                      />
                    </Cell>
                  </tr>
                </tbody>
              </table>
            </Box>
            <PopoverArrow />
          </PopoverContent>
        </>
      )}
    </Popover>
  );
}

function Cell({ children, as }) {
  const Tag = as;
  return (
    <Tag>
      <Flex justify="center" p="1">
        {children}
      </Flex>
    </Tag>
  );
}

const EMOTION_STRINGS = {
  HAPPY: "Happy",
  SAD: "Sad",
  SICK: "Sick",
};

const GENDER_PRESENTATION_STRINGS = {
  MASCULINE: "Masculine",
  FEMININE: "Feminine",
};

function PoseButton({ pose, speciesId, inputRef }) {
  const theme = useTheme();

  if (!pose) {
    return null;
  }

  const genderPresentationStr =
    GENDER_PRESENTATION_STRINGS[pose.genderPresentation];
  const emotionStr = EMOTION_STRINGS[pose.emotion];

  return (
    <Box
      as="label"
      cursor="pointer"
      onClick={(e) => {
        // HACK: We need the timeout to beat the popover's focus stealing!
        const input = e.currentTarget.querySelector("input");
        setTimeout(() => input.focus(), 0);
      }}
    >
      <VisuallyHidden
        as="input"
        type="radio"
        aria-label={`${emotionStr} and ${genderPresentationStr}`}
        name="pose"
        value={`${pose.emotion}-${pose.genderPresentation}`}
        checked={pose.isSelected}
        ref={inputRef || null}
      />
      <Box
        rounded="full"
        boxShadow="md"
        overflow="hidden"
        width="50px"
        height="50px"
        title={window.location.hostname.includes("localhost") && `#${pose.id}`}
        position="relative"
        className={css`
          transform: scale(0.8);
          opacity: 0.8;
          transition: all 0.2s;

          input:checked + & {
            transform: scale(1);
            opacity: 1;
          }
        `}
      >
        <Box
          rounded="full"
          position="absolute"
          top="0"
          bottom="0"
          left="0"
          right="0"
          zIndex="2"
          className={css`
            border: 0px solid ${theme.colors.green["600"]};
            transition: border-width 0.2s;

            input:checked + * & {
              border-width: 1px;
            }

            input:focus + * & {
              border-width: 3px;
            }
          `}
        />
        <Box
          width="50px"
          height="50px"
          transform={
            transformsBySpeciesId[speciesId] || transformsBySpeciesId.default
          }
        >
          <OutfitLayers visibleLayers={getVisibleLayers(pose, [])} />
        </Box>
      </Box>
    </Box>
  );
}

function EmojiImage({ src, "aria-label": ariaLabel }) {
  return <Image src={src} aria-label={ariaLabel} width="16px" height="16px" />;
}

function usePoses({ speciesId, colorId }) {
  const [selectedPose, selectPose] = React.useState({
    emotion: "HAPPY",
    genderPresentation: "FEMININE",
  });

  const { loading, error, data } = useQuery(
    gql`
      query PosePicker($speciesId: ID!, $colorId: ID!) {
        petAppearances(speciesId: $speciesId, colorId: $colorId) {
          id
          genderPresentation
          emotion
          approximateThumbnailUrl
          ...PetAppearanceForOutfitPreview
        }
      }
      ${petAppearanceFragment}
    `,
    { variables: { speciesId, colorId } }
  );

  const petAppearances = data?.petAppearances || [];
  const buildPose = (e, gp) => ({
    ...petAppearances.find(
      (pa) => pa.emotion === e && pa.genderPresentation === gp
    ),
    isSelected:
      selectedPose.emotion === e && selectedPose.genderPresentation === gp,
  });

  const poses = {
    happyMasc: buildPose("HAPPY", "MASCULINE"),
    sadMasc: buildPose("SAD", "MASCULINE"),
    sickMasc: buildPose("SICK", "MASCULINE"),
    happyFem: buildPose("HAPPY", "FEMININE"),
    sadFem: buildPose("SAD", "FEMININE"),
    sickFem: buildPose("SICK", "FEMININE"),
  };

  return { loading, error, poses, selectPose };
}

const transformsBySpeciesId = {
  "1": "translate(-5px, 10px) scale(2.8)",
  "2": "translate(-8px, 8px) scale(2.9)",
  "3": "translate(-1px, 17px) scale(3)",
  "4": "translate(-21px, 22px) scale(3.2)",
  "5": "translate(2px, 15px) scale(3.3)",
  "6": "translate(-14px, 28px) scale(3.4)",
  "7": "translate(-4px, 8px) scale(2.9)",
  "8": "translate(-26px, 30px) scale(3.0)",
  "9": "translate(-4px, 8px) scale(3.1)",
  "10": "translate(-14px, 18px) scale(3.0)",
  "11": "translate(-7px, 24px) scale(2.9)",
  "12": "translate(-16px, 20px) scale(3.5)",
  "13": "translate(-11px, 18px) scale(3.0)",
  "14": "translate(-14px, 26px) scale(3.5)",
  "15": "translate(-13px, 24px) scale(3.1)",
  "16": "translate(-6px, 29px) scale(3.1)",
  "17": "translate(3px, 13px) scale(3.1)",
  "18": "translate(2px, 27px) scale(3.4)",
  "19": "translate(-7px, 16px) scale(3.1)",
  "20": "translate(-2px, 15px) scale(3.0)",
  "21": "translate(-2px, -17px) scale(3.0)",
  "22": "translate(-14px, 16px) scale(3.6)",
  "23": "translate(-16px, 16px) scale(3.2)",
  "24": "translate(-2px, 6px) scale(3.2)",
  "25": "translate(-3px, 6px) scale(3.7)",
  "26": "translate(-7px, 19px) scale(5.2)",
  "27": "translate(-16px, 20px) scale(3.5)",
  "28": "translate(-3px, 24px) scale(3.2)",
  "29": "translate(-9px, 15px) scale(3.4)",
  "30": "translate(3px, 57px) scale(4.4)",
  "31": "translate(-28px, 35px) scale(3.8)",
  "32": "translate(-8px, 33px) scale(3.5)",
  "33": "translate(-8px, -6px) scale(3.2)",
  "34": "translate(-14px, 14px) scale(3.1)",
  "35": "translate(-12px, 0px) scale(3.4)",
  "36": "translate(6px, 23px) scale(3.3)",
  "37": "translate(-20px, 25px) scale(3.6)",
  "38": "translate(-16px, 28px) scale(4.0)",
  "39": "translate(-8px, 11px) scale(3.0)",
  "40": "translate(2px, 12px) scale(3.5)",
  "41": "translate(-3px, 18px) scale(3.0)",
  "42": "translate(-18px, 46px) scale(4.4)",
  "43": "translate(-6px, 22px) scale(3.2)",
  "44": "translate(-2px, 19px) scale(3.4)",
  "45": "translate(-11px, 32px) scale(3.3)",
  "46": "translate(-13px, 23px) scale(3.3)",
  "47": "translate(-14px, 4px) scale(3.1)",
  "48": "translate(-9px, 24px) scale(3.5)",
  "49": "translate(-14px, 25px) scale(3.4)",
  "50": "translate(-7px, 4px) scale(3.6)",
  "51": "translate(-13px, 16px) scale(3.2)",
  "52": "translate(-2px, 13px) scale(3.2)",
  "53": "translate(-6px, 4px) scale(3.1)",
  "54": "translate(-15px, 22px) scale(3.6)",
  "55": "translate(1px, 14px) scale(3.1)",
  default: "scale(2.5)",
};

export default PosePicker;