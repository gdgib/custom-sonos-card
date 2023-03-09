import { HomeAssistant } from 'custom-card-helpers';
import { HassEntity } from 'home-assistant-js-websocket';
import { html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import HassService from '../services/hass-service';
import MediaControlService from '../services/media-control-service';
import Store from '../store';
import { CardConfig, Members } from '../types';
import { clickableIcon, controlIcon, getEntityName, getGroupMembers, isPlaying, sharedStyle, stylable } from '../utils';

class MediaControls extends LitElement {
  @property() store!: Store;
  private hass!: HomeAssistant;
  private config!: CardConfig;
  @property()
  private entity!: HassEntity;
  @property() showVolumes!: boolean;
  @property() volumesToggled?: () => void;

  private isGroup!: boolean;
  private entityId!: string;
  private mediaControlService!: MediaControlService;
  private hassService!: HassService;
  private members!: Members;
  @state() private timerToggleShowAllVolumes!: number;

  render() {
    ({
      config: this.config,
      hass: this.hass,
      entityId: this.entityId,
      entity: this.entity,
      mediaControlService: this.mediaControlService,
    } = this.store);
    this.members = this.store.groups[this.entityId].members;
    this.isGroup = getGroupMembers(this.entity).length > 1;
    let allVolumes = [];
    if (this.isGroup) {
      allVolumes = getGroupMembers(this.entity).map((entityId: string) => this.groupMemberVolume(entityId));
    }
    const playing = !isPlaying(this.entity.state);

    // ${controlIcon(this.config,'mdi:volume-minus', this.volDown)}
    // ${controlIcon(thithis.config,s.repeatIcon(), this.repeat)} ${until(this.getAdditionalSwitches())}
    // ${controlIcon(thithis.config,s.shuffleIcon(), this.shuffle)}
    // ${controlIcon(this.config,'mdi:volume-plus', this.volUp)}

    return html`
      <div style="${this.mainStyle()}" id="mediaControls">
        <div ?hidden="${!this.showVolumes}">${allVolumes}</div>
        <div style="${this.iconsStyle()}">
          ${controlIcon(this.config, 'mdi:skip-backward', this.prev)}
          ${playing
            ? controlIcon(this.config, 'mdi:play', this.play)
            : controlIcon(this.config, 'mdi:stop', this.pause)}
          ${controlIcon(this.config, 'mdi:skip-forward', this.next)}
          ${!this.isGroup ? html`` : controlIcon(this.config, 'mdi:arrow-expand-vertical', this.toggleShowAllVolumes)}
        </div>
        ${this.mainVolume()}
      </div>
    `;
  }

  private volDown = async () => await this.mediaControlService.volumeDown(this.entityId, this.members);
  private prev = async () => await this.mediaControlService.prev(this.entityId);
  private play = async () => await this.mediaControlService.play(this.entityId);
  private pause = async () => await this.mediaControlService.pause(this.entityId);
  private next = async () => await this.mediaControlService.next(this.entityId);
  private shuffle = async () => await this.mediaControlService.shuffle(this.entityId, !this.entity?.attributes.shuffle);
  private repeat = async () => await this.mediaControlService.repeat(this.entityId, this.entity?.attributes.repeat);
  private volUp = async () => await this.mediaControlService.volumeUp(this.entityId, this.members);

  private shuffleIcon() {
    return this.entity?.attributes.shuffle ? 'mdi:shuffle-variant' : 'mdi:shuffle-disabled';
  }

  private repeatIcon() {
    const repeatState = this.entity?.attributes.repeat;
    return repeatState === 'all' ? 'mdi:repeat' : repeatState === 'one' ? 'mdi:repeat-once' : 'mdi:repeat-off';
  }

  private getAdditionalSwitches() {
    if (!this.config.skipAdditionalPlayerSwitches) {
      return this.hassService.getRelatedSwitchEntities(this.entityId).then((items: string[]) => {
        return items.map((item: string) => {
          return controlIcon(
            this.config,
            this.hass.states[item].attributes.icon || '',
            () => this.hassService.toggle(item),
            this.hass.states[item].state === 'on' ? { color: 'var(--sonos-int-accent-color)' } : {},
          );
        });
      });
    }
    return '';
  }

  private mainStyle() {
    return stylable('media-controls', this.config, {
      background: 'var(--sonos-int-player-section-background)',
      margin: '0.25rem',
      padding: '0.5rem',
      borderRadius: 'var(--sonos-int-border-radius)',
      overflow: 'hidden auto',
    });
  }

  private iconsStyle() {
    return stylable('media-controls-icons', this.config, {
      justifyContent: 'center',
      display: this.showVolumes ? 'none' : 'flex',
    });
  }

  private volumeNameStyle(hidden: boolean) {
    return stylable('player-volume-name', this.config, {
      marginTop: '1rem',
      marginLeft: '0.4rem',
      flex: '1',
      overflow: 'hidden',
      flexDirection: 'column',
      ...(hidden && { display: 'none' }),
    });
  }

  private volumeNameTextStyle() {
    return stylable('player-volume-name-text', this.config, {
      flex: '1',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    });
  }

  private volumeNameIconStyle() {
    return stylable('player-volume-name-icon', this.config, {
      flex: '1',
      '--mdc-icon-size': '1.5rem',
      marginLeft: '-0.3rem',
    });
  }

  static get styles() {
    return sharedStyle;
  }

  private mainVolume() {
    const name = this.config.allVolumesText ? this.config.allVolumesText : 'All';
    return this.volume(this.entityId, name, this.members);
  }

  private groupMemberVolume(entityId: string) {
    const name = getEntityName(this.hass, this.config, entityId);
    return this.volume(entityId, name);
  }
  private volume(entityId: string, name: string, members?: Members) {
    return html` <div style="display: flex">
      <div style="${this.volumeNameStyle(!this.showVolumes)}">
        <div style="${this.volumeNameTextStyle()}">${name}</div>
        ${members
          ? clickableIcon(this.config, 'mdi:arrow-left', () => this.toggleShowAllVolumes(), this.volumeNameIconStyle())
          : html``}
      </div>
      <sonos-volume
        .store=${this.store}
        .entityId=${entityId}
        .members=${members}
        style="${this.volumeStyle(this.showVolumes, !members)}"
        @volumeClicked=${this.volumeClicked}
      ></sonos-volume>
    </div>`;
  }
  private volumeClicked = () => {
    if (this.isGroup) {
      this.toggleShowAllVolumes();
    }
  };

  toggleShowAllVolumes = () => {
    this.showVolumes = !this.showVolumes;
    clearTimeout(this.timerToggleShowAllVolumes);
    if (this.showVolumes) {
      this.scrollToBottom();
      this.timerToggleShowAllVolumes = window.setTimeout(() => {
        this.showVolumes = false;
        this.dispatchVolumesToggled();
        window.scrollTo(0, 0);
      }, 30000);
    }
    this.dispatchVolumesToggled();
  };

  private dispatchVolumesToggled() {
    this.dispatchEvent(new CustomEvent('volumesToggled', { detail: this.showVolumes }));
  }

  private scrollToBottom() {
    setTimeout(() => {
      const mediaControls = this.renderRoot?.querySelector('#mediaControls');
      if (mediaControls) {
        mediaControls.scrollTop = mediaControls.scrollHeight;
      }
    });
  }

  private volumeStyle(showVolumes: boolean, isGroup: boolean) {
    return stylable('player-volume', this.config, {
      flex: showVolumes ? '4' : '1',
      ...(isGroup && {
        borderBottom: 'dotted var(--sonos-int-color)',
        marginTop: '0.4rem',
      }),
    });
  }
}

customElements.define('sonos-media-controls', MediaControls);
