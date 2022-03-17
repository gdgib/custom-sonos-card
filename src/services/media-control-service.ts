import { MediaPlayerItem, Members } from '../types';
import HassService from './hass-service';
import { HomeAssistant } from 'custom-card-helpers';

export default class MediaControlService {
  private hassService: HassService;
  private hass: HomeAssistant;

  constructor(hass: HomeAssistant, hassService: HassService) {
    this.hassService = hassService;
    this.hass = hass;
  }

  join(master: string, ...entities: string[]) {
    this.hassService.callSonosService('join', {
      master,
      entity_id: entities.join(','),
    });
  }

  unjoin(...entities: string[]) {
    this.hassService.callSonosService('unjoin', {
      entity_id: entities.join(','),
    });
  }

  pause(entity_id: string) {
    this.hassService.callMediaService('media_pause', { entity_id });
  }

  prev(entity_id: string) {
    this.hassService.callMediaService('media_previous_track', {
      entity_id,
    });
  }

  next(entity_id: string) {
    this.hassService.callMediaService('media_next_track', { entity_id });
  }

  play(entity_id: string) {
    this.hassService.callMediaService('media_play', { entity_id });
  }

  shuffle(entity_id: string, state: boolean) {
    this.hassService.callMediaService('shuffle_set', { entity_id, shuffle: state });
  }

  repeat(entity_id: string, currentState: string) {
    const repeat = currentState === 'all' ? 'one' : currentState === 'one' ? 'off' : 'all';
    this.hassService.callMediaService('repeat_set', { entity_id, repeat });
  }

  volumeDown(entity_id: string, members: Members) {
    this.hassService.callMediaService('volume_down', { entity_id });

    for (const entity_id in members) {
      this.hassService.callMediaService('volume_down', { entity_id: entity_id });
    }
  }

  volumeUp(entity_id: string, members: Members) {
    this.hassService.callMediaService('volume_up', { entity_id });

    for (const entity_id in members) {
      this.hassService.callMediaService('volume_up', { entity_id: entity_id });
    }
  }

  volumeSet(entity_id: string, volume: string, members?: Members) {
    const volume_level = Number.parseInt(volume) / 100;

    this.hassService.callMediaService('volume_set', { entity_id, volume_level: volume_level });

    for (const entity_id in members) {
      this.hassService.callMediaService('volume_set', { entity_id, volume_level });
    }
  }

  volumeMute(entity_id: string, is_volume_muted: boolean, members?: Members) {
    this.hassService.callMediaService('volume_mute', { entity_id, is_volume_muted });

    for (const entity_id in members) {
      this.hassService.callMediaService('volume_mute', { entity_id, is_volume_muted });
    }
  }

  setSource(entity_id: string, source: string) {
    this.hassService.callMediaService('select_source', { source: source, entity_id });
  }

  playMedia(entity_id: string, item: MediaPlayerItem) {
    this.hassService.callMediaService('play_media', {
      entity_id,
      media_content_id: item.media_content_id,
      media_content_type: item.media_content_type,
    });
  }
}
