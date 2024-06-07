## Saga

A Saga is an aggregate whose responsibility is to enforce cross-boundary invariants.
It reacts to events emitted from different boundaries and execute corresponding commands.

For exemple:
```ts

class DeleteFinishedSprintIssuesSaga {

    static start(issueIds: IssueId[]){
        return new this({ issueIds, commands: issueIds.map(issueId => new DeleteIssueCommand({ issueId })) })
    }

    onIssueDeleted(event: IssueDeleted){
        this.issueIds.delete(event.issueId)
        if(this.issueIds.length === 0){
            this.done = true;
        }
    }
}

class SprintIssues {
    onSprintFinished(){
        return new DeleteFinishedSprintIssuesSaga({
            issues: this.issues,
            commands: [
                this.issues.map(issueId => new DeleteIssueCommand({ issueId }))
            ]
        })
    }
}

class Issue {

    onSprintFinished()

}

```