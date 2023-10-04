# Contributing

We'd love you to contribute to darklens. We want contribution to the project to be fun, enjoyable, and educational for anyone and everyone. All contributions are welcome, including issues, new docs as well as updates and tweaks, blog posts, workshops, and more.

## Code of Conduct

Help us keep darklens open and inclusive. Please read and follow our [Code of Conduct](/CODE_OF_CONDUCT.md).

## How to Start?

If you're worried or don’t know where to start, check out our next section explaining what kind of help we could use and where you can become involved.

## Development

1. Setup backend

    1. Goto `web/backend`
    2. Run `npm i`
    3. Copy `.env.example` to `.env`

2. Setup frontend

    1. Goto `web/frontend`
    2. Run `npm i`
    3. Copy `.env.example` to `.env`

3. Setup development Traefik

    1. Goto `web`
    2. Run `docker compose -f docker-compose.dev.yaml up`

4. Develop

    1. Goto `web/backend` and run `npm start`
    2. Goto `web/frontend` and run `npm start`
    3. The app will be available on `localhost:8000`

    > Make sure the `dev-traefik` container is running as it routes the traffic between the frontend and the backend

## Git branching strategy

We have two persistent branches: main, develop.
PRs are going into develop.
The develop branch is always fast-forward mergable to main.
PR titles must follow the conventional commit guidelines.

Release: a release commit is made to develop, package versions are bumped, develop is fast-forward merged into main.
Hotfix: in rare occassions, a hotfix/\*\* branch is created from main and the PR targets the main branch,
develop must be rebased to main -- using rebase-onto.

## Submit a Pull Request

Branch naming convention is as following

`TYPE/DESCRIPTION-DESCRIPTION`

When `TYPE` can be:

-   `chore/` - Formatting, style, repository structure, or version updates that do not affect functionality.
-   `cicd/` - Changes related to the CI/CD system, such as build script or configuration updates.
-   `doc/` - Changes focused on documentation updates, including README files, documentation files, or code comments.
-   `feat/` - Implementation of new features or functionality.
-   `fix/` - Resolution of bugs or issues in the codebase.
-   `hotfix/` - Urgent bug fixes on the main branch to address critical issues.
-   `refactor/` - Code changes to improve structure, readability, or maintainability.
-   `test/` - Changes related to testing, including adding or modifying test cases or improving the testing infrastructure.

All PRs must include a commit message with the changes described.

darklens is following Conventional Commits, the commit messages should be structured as follows:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

The commit contains the following structural elements, to communicate intent to the consumers of darklens library:

1. **fix:** a commit of the _type_ `fix` patches a bug in your codebase (this correlates with [`PATCH`](http://semver.org/#summary) in Semantic Versioning).
1. **feat:** a commit of the _type_ `feat` introduces a new feature to the codebase (this correlates with [`MINOR`](http://semver.org/#summary) in Semantic Versioning).
1. **BREAKING CHANGE:** a commit that has a footer `BREAKING CHANGE:`, or appends a `!` after the type/scope, introduces a breaking API change (correlating with [`MAJOR`](http://semver.org/#summary) in Semantic Versioning).
   A BREAKING CHANGE can be part of commits of any _type_.
1. _types_ other than `fix:` and `feat:` are allowed, for example [@commitlint/config-conventional](https://github.com/conventional-changelog/commitlint/tree/master/%40commitlint/config-conventional) (based on the [the Angular convention](https://github.com/angular/angular/blob/22b96b9/CONTRIBUTING.md#-commit-message-guidelines)) recommends `build:`, `chore:`,
   `ci:`, `docs:`, `style:`, `refactor:`, `perf:`, `test:`, and others.
1. _footers_ other than `BREAKING CHANGE: <description>` may be provided and follow a convention similar to
   [git trailer format](https://git-scm.com/docs/git-interpret-trailers).

More info: [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/#specification).

## Security & Privacy

Security and privacy are extremely important to darklens' core team, its independent developers, and users alike. Make sure to follow the best industry standards and practices.

## Dependencies

Please avoid introducing new dependencies to darklens without consulting the team. New dependencies can be very helpful but also introduce new security and privacy issues, complexity, and impact total docker image size.

Adding a new dependency should provide meaningful value to the tool with minimum possible risk.

## Other Ways to Help

Pull requests are great, but there are many other areas where you can help darklens.

### Sending Feedbacks & Reporting Bugs

Sending feedback is a great way for us to understand your different use cases of darklens better. If you had any issues, bugs, or want to share about your experience, feel free to do so on our GitHub issues page.

### Submitting New Ideas

If you think darklens could use a new feature, please open an issue on our GitHub repository, stating as much information as you can think of your new idea and it's implications. We'd also use this issue to gather more information, get more feedback from the community, and have a proper discussion about the new feature.

### Improving Documentation

Submitting documentation updates, enhancements, designs, or bug fixes. Spelling or grammar fixes will be very much appreciated.

### Commit signatures

Submitting pull requests require all commits to be signed with a GPG signature. Refer to the [GitHub documentation](https://docs.github.com/en/authentication/managing-commit-signature-verification) to setup GPG signing.
