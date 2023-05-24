import { HomeAssistant } from 'custom-card-helpers';
import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import MediaControlService from '../services/media-control-service';
import Store from '../store';
import { CardConfig, PlayerGroups } from '../types';
import { getEntityName, listenForEntityId, listStyle, stopListeningForEntityId } from '../utils';
import { getButton } from '../components/button';

export class Grouping extends LitElement {
  @property() store!: Store;
  private hass!: HomeAssistant;
  private config!: CardConfig;
  private entityId!: string;
  private mediaControlService!: MediaControlService;
  private groups!: PlayerGroups;
  private mediaPlayers!: string[];

  entityIdListener = (event: Event) => {
    this.entityId = (event as CustomEvent).detail.entityId;
  };

  connectedCallback() {
    super.connectedCallback();
    listenForEntityId(this.entityIdListener);
  }

  disconnectedCallback() {
    stopListeningForEntityId(this.entityIdListener);
    super.disconnectedCallback();
  }

  render() {
    ({
      config: this.config,
      hass: this.hass,
      groups: this.groups,
      entityId: this.entityId,
      mediaControlService: this.mediaControlService,
      mediaPlayers: this.mediaPlayers,
    } = this.store);
    const joinedPlayers = this.mediaPlayers.filter(
      (player) => player !== this.entityId && this.groups[this.entityId].members[player],
    );
    const notJoinedPlayers = this.mediaPlayers.filter(
      (player) => player !== this.entityId && !this.groups[this.entityId].members[player],
    );
    return html`
      <div class="buttons">
        ${when(notJoinedPlayers.length, () => {
          const click = async () => await this.mediaControlService.join(this.entityId, notJoinedPlayers);
          return getButton(click, 'mdi:checkbox-multiple-marked-outline', '');
        })}
        ${when(joinedPlayers.length, () => {
          const click = async () => await this.mediaControlService.unjoin(joinedPlayers);
          return getButton(click, 'mdi:minus-box-multiple-outline', '');
        })}
        ${when(this.config.predefinedGroups && true, () => this.renderPredefinedGroups())}
      </div>
      <mwc-list multi style="${listStyle()}">
        ${this.mediaPlayers
          .map((entity) => this.getGroupingItem(entity))
          .map((groupingItem) => {
            return html`<mwc-list-item
              ?activated="${groupingItem.isMember}"
              ?disabled="${groupingItem.isMain}"
              @click="${!groupingItem.isMain && this.itemClickAction(groupingItem)}"
            >
              <ha-icon
                .icon="${groupingItem.isMember ? 'mdi:checkbox-marked-outline' : 'mdi:checkbox-blank-outline'}"
              ></ha-icon>
              <span>${groupingItem.name}</span>
            </mwc-list-item>`;
          })}
      </mwc-list>
    `;
  }

  private getGroupingItem(entity: string): GroupingItem {
    const isMain = entity === this.entityId;
    return {
      isMain,
      isMember: isMain || !!this.groups[this.entityId].members[entity],
      name: getEntityName(this.hass, this.config, entity),
      entity: entity,
    };
  }
  private itemClickAction({ isMain, isMember, entity }: GroupingItem) {
    if (isMain) {
      return async () => await this.mediaControlService.unjoin([entity]);
    } else if (isMember) {
      return async () => await this.mediaControlService.unjoin([entity]);
    } else {
      return async () => await this.mediaControlService.join(this.entityId, [entity]);
    }
  }

  private renderPredefinedGroups() {
    return this.config.predefinedGroups
      ?.filter((group) => group.entities.length > 1)
      .map((group) => {
        const click = async () => await this.mediaControlService.createGroup(group.entities, this.groups);
        return getButton(click, 'mdi:speaker-multiple', group.name);
      });
  }

  static get styles() {
    return [
      css`
        .buttons {
          margin: 0.5rem 0.5rem 1rem;
        }
      `,
    ];
  }
}

interface GroupingItem {
  isMain: boolean;
  isMember: boolean;
  name: string;
  entity: string;
}
