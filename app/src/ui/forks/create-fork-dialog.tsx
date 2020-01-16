import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Dispatcher } from '../dispatcher'
import { RepositoryWithGitHubRepository } from '../../models/repository'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { DialogHeader } from '../dialog/header'
import { sendNonFatalException } from '../../lib/helpers/non-fatal-exception'
import { Account } from '../../models/account'
import { API } from '../../lib/api'
import { LinkButton } from '../lib/link-button'
import { Button } from '../lib/button'

interface ICreateForkDialogProps {
  readonly dispatcher: Dispatcher
  readonly repository: RepositoryWithGitHubRepository
  readonly account: Account
  readonly onDismissed: () => void
}

interface ICreateForkDialogState {
  readonly loading: boolean
  readonly error?: Error
}

/**
 * Dialog offering to make a fork of the given repository
 */
export class CreateForkDialog extends React.Component<
  ICreateForkDialogProps,
  ICreateForkDialogState
> {
  public constructor(props: ICreateForkDialogProps) {
    super(props)
    this.state = { loading: false }
  }
  /**
   *  Starts fork process on GitHub!
   */
  private onSubmit = async () => {
    this.setState({ loading: true })
    const { gitHubRepository } = this.props.repository
    const api = API.fromAccount(this.props.account)
    try {
      const fork = await api.forkRepository(
        gitHubRepository.owner.login,
        gitHubRepository.name
      )
      await this.props.dispatcher.convertRepositoryToFork(
        this.props.repository,
        fork
      )
      this.setState({ loading: false })
      this.props.onDismissed()
    } catch (e) {
      log.error(`Fork creation through API failed (${e})`)
      sendNonFatalException('forkCreation', e)
      this.setState({ error: e })
      this.setState({ loading: false })
    }
  }

  public render() {
    if (this.state.error === undefined) {
      return (
        <Dialog
          onDismissed={this.props.onDismissed}
          onSubmit={this.onSubmit}
          type="normal"
          key={this.props.repository.name}
        >
          <DialogHeader
            title="Do you want to fork this repository?"
            dismissable={!this.state.loading}
            onDismissed={this.props.onDismissed}
            loading={this.state.loading}
          />
          <DialogContent>
            Looks like you don’t have write access to this repository. Do you
            want to fork this repository to continue?
          </DialogContent>
          <DialogFooter>
            <OkCancelButtonGroup
              destructive={true}
              okButtonText={
                __DARWIN__ ? 'Fork This Repository' : 'Fork this repository'
              }
              okButtonDisabled={this.state.loading}
              cancelButtonDisabled={this.state.loading}
            />
          </DialogFooter>
        </Dialog>
      )
    }
    return this.renderError()
  }

  private renderError() {
    const suggestion =
      this.props.repository.gitHubRepository.htmlURL !== null ? (
        <>
          You can try creating the fork manually at{' '}
          <LinkButton>
            {this.props.repository.gitHubRepository.htmlURL}
          </LinkButton>
        </>
      ) : (
        undefined
      )
    return (
      <Dialog
        onDismissed={this.props.onDismissed}
        type="error"
        title={__DARWIN__ ? 'Fork Creation Failed' : 'Fork creation failed'}
        key={this.props.repository.name}
      >
        <DialogContent>
          {`Creating a fork for ${this.props.repository.name} failed. `}
          {suggestion}
        </DialogContent>
        <DialogFooter>
          <Button tooltip="Ok" type="submit">
            Ok
          </Button>
        </DialogFooter>
      </Dialog>
    )
  }
}
