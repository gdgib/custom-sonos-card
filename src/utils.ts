import { HomeAssistant } from 'custom-card-helpers';
import { CardConfig, PlayerGroups, Size } from './types';

export function getEntityName(hass: HomeAssistant, config: CardConfig, entity: string) {
  const name = hass.states[entity].attributes.friendly_name || '';
  if (config.entityNameRegex) {
    const parts = config.entityNameRegex.split('/').filter((i: string) => i);
    if (parts.length === 2) {
      const [pattern, replaceWith] = parts;
      return name.replace(new RegExp(pattern, 'g'), replaceWith);
    }
  } else if (config.entityNameRegexToReplace) {
    return name.replace(new RegExp(config.entityNameRegexToReplace, 'g'), config.entityNameReplacement || '');
  }
  return name;
}

export function getGroupMembers(state: { attributes: { [p: string]: any } }) {
  return state.attributes.sonos_group || state.attributes.group_members;
}

export function getMediaPlayers(config: CardConfig, hass: HomeAssistant) {
  if (config.entities) {
    return [...new Set(config.entities)].filter((player) => hass.states[player]);
  } else {
    return Object.values(hass.states)
      .filter(getGroupMembers)
      .map((state) => state.entity_id)
      .sort();
  }
}

export function createPlayerGroups(mediaPlayers: string[], hass: HomeAssistant, config: CardConfig): PlayerGroups {
  const groupMasters = mediaPlayers.filter((player) => createGroupMasters(hass, player, mediaPlayers));
  const groupArray = groupMasters.map((groupMaster) => createGroupArray(hass, groupMaster, mediaPlayers, config));
  return Object.fromEntries(groupArray.map((group) => [group.entity, group]));
}

function createGroupMasters(hass: HomeAssistant, player: string, mediaPlayers: string[]) {
  const state = hass.states[player];
  try {
    const sonosGroup = getGroupMembers(state).filter((member: string) => mediaPlayers.indexOf(member) > -1);
    const isGrouped = sonosGroup?.length > 1;
    const isMasterInGroup = isGrouped && sonosGroup && sonosGroup[0] === player;
    return !isGrouped || isMasterInGroup;
  } catch (e) {
    console.error('Failed to determine group master', JSON.stringify(state), e);
    return false;
  }
}

function createGroupArray(hass: HomeAssistant, groupMaster: string, mediaPlayers: string[], config: CardConfig) {
  const state = hass.states[groupMaster];
  try {
    const membersArray = getGroupMembers(state).filter((member: string) => {
      return member !== groupMaster && mediaPlayers.indexOf(member) > -1;
    });
    return {
      entity: groupMaster,
      state: state.state,
      roomName: getEntityName(hass, config, groupMaster),
      members: createGroupMembers(membersArray, hass, config),
    };
  } catch (e) {
    console.error('Failed to create group', JSON.stringify(state), e);
    return {};
  }
}

function createGroupMembers(membersArray: string[], hass: HomeAssistant, config: CardConfig) {
  return Object.fromEntries(
    membersArray.map((member: string) => {
      const friendlyName = getEntityName(hass, config, member);
      return [member, friendlyName];
    }),
  );
}

export function getWidth(config: CardConfig, defaultWidth: string, defaultMobileWidth: string, size?: Size) {
  return isMobile(config) ? size?.mobileWidth || defaultMobileWidth : size?.width || defaultWidth;
}

export function isMobile(config: CardConfig) {
  return innerWidth < (config.layout?.mobileThresholdPx || 650);
}
