import React from 'react';
import { observer } from 'mobx-react-lite';

import { Title, Header, StyledSettingsCardGrid } from '../../style';
import { Textfield } from '~/renderer/components/Textfield';
import { RadioButton } from '~/renderer/components/RadioButton';
import Button from '~/renderer/components/Button';
import { IStartupTab } from '~/interfaces/startup-tab';
import { ICON_CLOSE } from '~/renderer/constants';
import store from '../../store';
import Card from '~/renderer/components/Card';
import { faBrowsers } from '@fortawesome/pro-solid-svg-icons';

interface Props {
  initialValue: 'continue' | 'urls' | 'empty';
  initialURLS: IStartupTab[];
}

interface State {
  value: 'continue' | 'urls' | 'empty';
  customURLs: IStartupTab[];
}

class StartupControl extends React.PureComponent<Props, State> {
  public state: State = {
    value: this.props.initialValue,
    customURLs: this.props.initialURLS,
  };

  public get selectedItem() {
    return this.state.value || this.props.initialValue;
  }

  public set selectedItem(val: 'continue' | 'urls' | 'empty') {
    store.settings.startupBehavior.type = val;
    store.save();

    if (val === 'empty') {
      store.startupTabs.clearStartupTabs(false, true);
      this.setState({ value: val, customURLs: [] });
    } else if (val === 'urls') {
      const defaultItems: IStartupTab[] = this.props.initialURLS || [];
      store.startupTabs.addStartupDefaultTabItems(defaultItems);
      this.setState({ value: val, customURLs: defaultItems });
    } else if (val === 'continue') {
      store.startupTabs.clearUserDefined();
      this.setState({ value: val, customURLs: [] });
    }
  }

  private select = (value: 'continue' | 'urls' | 'empty') => () => {
    this.selectedItem = value;
  };

  private onAddNewPageClick = () => {
    this.setState({
      customURLs: [
        ...this.state.customURLs,
        {
          isUserDefined: true,
          pinned: false,
        },
      ],
      value: 'urls',
    });
  };

  private onUpdateItemURL = (index: number, value: string) => {
    const newURLs = [...this.state.customURLs];
    newURLs[index].url = value;

    this.setState({
      value: 'urls',
      customURLs: newURLs,
    });
    this.saveCustomPages(newURLs);
  };

  private onDeleteItemClick = (index: number) => {
    const newURLs = [...this.state.customURLs].filter((item, j) => j !== index);
    this.setState({
      value: 'urls',
      customURLs: newURLs,
    });
    this.saveCustomPages(newURLs);
  };

  private saveCustomPages = (pages: IStartupTab[]) => {
    store.startupTabs.addStartupDefaultTabItems(pages);
  };

  public render() {
    const titleStyle = {
      marginLeft: 8,
    };

    const rowStyle = {
      cursor: 'pointer',
    };

    return (
      <>
        <Header>On Startup</Header>
        <span>Customize how Skye starts up to the way you want it.</span>
        <StyledSettingsCardGrid>
          <Card
            title={'Open Innatical Tab'}
            subtitle={this.state.value === 'empty' ? 'Enabled' : 'Disabled'}
            icon={faBrowsers}
          />
          <Card
            title={'Contiune where you left off'}
            subtitle={this.state.value === 'continue' ? 'Enabled' : 'Disabled'}
          />
          <Card
            title={'Open Specific Pages'}
            subtitle={this.state.value === 'urls' ? 'Enabled' : 'Disabled'}
          />

          {this.state.value === 'urls' && (
            <div style={{ marginLeft: 36 }}>
              <div>
                {this.state.customURLs.map((item, index) => (
                  <Textfield
                    key={index}
                    width={350}
                    placeholder={item.url}
                    onChange={(value) => this.onUpdateItemURL(index, value)}
                    icon={ICON_CLOSE}
                    onIconClick={(target) => this.onDeleteItemClick(index)}
                    delay={500}
                    style={{ marginBottom: 8 }}
                  />
                ))}
              </div>

              <Button primary onClick={this.onAddNewPageClick}>
                Add a new page
              </Button>
            </div>
          )}
        </StyledSettingsCardGrid>
      </>
    );
  }
}

export const OnStartup = observer(() => {
  const { type } = store.settings.startupBehavior;
  const startupTabList = store.startupTabs.list.filter((x) => x.isUserDefined);
  return <StartupControl initialValue={type} initialURLS={startupTabList} />;
});
