import React from "react";
import gql from "graphql-tag";
import { useQuery } from "@apollo/react-hooks";
import { Box, Flex, Select, Text, useToast } from "@chakra-ui/core";

import { Delay } from "./util";

function SpeciesColorPicker({
  outfitState,
  dispatchToOutfit,
  onFocus,
  onBlur,
}) {
  const toast = useToast();
  const { loading, error, data } = useQuery(gql`
    query {
      allSpecies {
        id
        name
      }

      allColors {
        id
        name
      }

      allValidSpeciesColorPairs {
        species {
          id
        }
        color {
          id
        }
      }
    }
  `);

  const allColors = (data && [...data.allColors]) || [];
  allColors.sort((a, b) => a.name.localeCompare(b.name));
  const allSpecies = (data && [...data.allSpecies]) || [];
  allSpecies.sort((a, b) => a.name.localeCompare(b.name));
  const allValidSpeciesColorPairs = React.useMemo(
    () =>
      new Set(
        ((data && data.allValidSpeciesColorPairs) || []).map(
          (p) => `${p.species.id},${p.color.id}`
        )
      ),
    [data]
  );

  if (loading) {
    return (
      <Delay ms={5000}>
        <Text color="gray.50" textShadow="md">
          Loading species/color data…
        </Text>
      </Delay>
    );
  }

  if (error) {
    return (
      <Text color="gray.50" textShadow="md">
        Error loading species/color data.
      </Text>
    );
  }

  const onChangeColor = (e) => {
    const speciesId = outfitState.speciesId;
    const colorId = e.target.value;
    const pair = `${speciesId},${colorId}`;
    if (allValidSpeciesColorPairs.has(pair)) {
      dispatchToOutfit({ type: "changeColor", colorId: e.target.value });
    } else {
      const species = allSpecies.find((s) => s.id === speciesId);
      const color = allColors.find((c) => c.id === colorId);
      toast({
        title: `We haven't seen a ${color.name} ${species.name} before! 😓`,
        status: "warning",
      });
    }
  };

  const onChangeSpecies = (e) => {
    const colorId = outfitState.colorId;
    const speciesId = e.target.value;
    const pair = `${speciesId},${colorId}`;
    if (allValidSpeciesColorPairs.has(pair)) {
      dispatchToOutfit({ type: "changeSpecies", speciesId: e.target.value });
    } else {
      const species = allSpecies.find((s) => s.id === speciesId);
      const color = allColors.find((c) => c.id === colorId);
      toast({
        title: `We haven't seen a ${color.name} ${species.name} before! 😓`,
      });
    }
  };

  return (
    <Flex direction="row">
      <Select
        aria-label="Pet color"
        value={outfitState.colorId}
        onChange={onChangeColor}
        backgroundColor="gray.600"
        color="gray.50"
        border="none"
        boxShadow="md"
        onFocus={onFocus}
        onBlur={onBlur}
      >
        {allColors.map((color) => (
          <option key={color.id} value={color.id}>
            {color.name}
          </option>
        ))}
      </Select>
      <Box width="8" />
      <Select
        aria-label="Pet species"
        value={outfitState.speciesId}
        onChange={onChangeSpecies}
        backgroundColor="gray.600"
        color="gray.50"
        border="none"
        boxShadow="md"
        onFocus={onFocus}
        onBlur={onBlur}
      >
        {allSpecies.map((species) => (
          <option key={species.id} value={species.id}>
            {species.name}
          </option>
        ))}
      </Select>
    </Flex>
  );
}

export default SpeciesColorPicker;