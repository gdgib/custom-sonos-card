import { html, TemplateResult } from 'lit';
import { state } from 'lit/decorators.js';
import { mdiPen, mdiPlus } from '@mdi/js';
import { BaseEditor } from './base-editor';

export const ENTITIES_RENAME_SCHEMA = [
  {
    type: 'string',
    name: 'entityNameRegexToReplace',
  },
  {
    type: 'string',
    name: 'entityNameReplacement',
  },
];

export const ENTITIES_SCHEMA = [
  {
    name: 'entityId',
    help: 'Not needed, but forces this player to be the selected one on loading the card (overrides url param etc)',
    selector: { entity: { multiple: false, filter: { integration: 'sonos', domain: 'media_player' } } },
  },
  {
    name: 'entities',
    help: "Not needed, unless you don't want to include all of them",
    selector: { entity: { multiple: true, filter: { integration: 'sonos', domain: 'media_player' } } },
  },
];

class EntitiesEditor extends BaseEditor {
  @state() editGroup!: number;

  protected render(): TemplateResult {
    ({ config: this.config, hass: this.hass } = this.store);
    const predefinedGroups = this.config.predefinedGroups;

    return this.editGroup > -1
      ? html`<sonos-card-predefined-group-editor
          .index=${this.editGroup}
          .store=${this.store}
          @closed=${() => (this.editGroup = -1)}
        ></sonos-card-predefined-group-editor>`
      : html`
          <sonos-card-editor-form .schema=${ENTITIES_SCHEMA} .store=${this.store}></sonos-card-editor-form>
          <div>
            Predefined Groups
            <ha-control-button-group>
              ${predefinedGroups?.map(
                (pg, index) => html`
                  <ha-control-button @click="${() => (this.editGroup = index)}">
                    ${pg.name}<ha-svg-icon .path=${mdiPen} label="Edit Group"></ha-svg-icon>
                  </ha-control-button>
                `,
              )}
              <ha-control-button @click="${() => (this.editGroup = predefinedGroups ? predefinedGroups.length : 0)}">
                Add group<ha-svg-icon .path=${mdiPlus} label="Add Group"></ha-svg-icon>
              </ha-control-button>
            </ha-control-button-group>
          </div>

          <div>
            Entity Renaming
            <sonos-card-editor-form .schema=${ENTITIES_RENAME_SCHEMA} .store=${this.store}></sonos-card-editor-form>
          </div>
        `;
  }
}

customElements.define('sonos-card-entities-editor', EntitiesEditor);
