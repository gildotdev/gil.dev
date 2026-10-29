---
class: "note"
tags:
  - "dev/ai/agents"
  - "dev/docker/devcontainers"
  - "reference"
aliases: []
canonicalURL: "https://chatgpt.com/s/cx_6ae35db499f481919dfed6b2d8d5f11a"
title: "Dev Containers And Devpod For Ai Agents"
slug: "dev-containers-and-devpod-for-ai-agents"
created: "2026-10-21T00:00:00+0000"
updated: "2026-10-29T10:52:00-0400"
topics:
  - "ai"
  - "dev-tools"
status: "reference"
description: "Reference material for “Dev Containers And Devpod For Ai Agents”, including the original source and supporting notes."
---

An AI coding agent needs more than a model and a repository. It needs somewhere to run: a filesystem, tools, dependencies, credentials, and enough freedom to build and test its work.

My working idea: **treat the agent’s development environment as part of the project, and treat each agent workspace as disposable.**

## Dev containers and DevPod solve different parts of the problem

A **dev container** defines the project’s development environment: its image, tools, dependencies, and setup. A **DevPod workspace** is a provisioned environment that uses that definition. DevPod can place it on local Docker, an SSH host, Kubernetes, or cloud infrastructure through providers.

The practical comparison is a dev container launched directly versus the same environment managed through DevPod. Dev containers can also run remotely without DevPod.

| Concern | Launched directly | Managed through DevPod |

| Definition | `.devcontainer/devcontainer.json` | Same underlying definition |
| Location | Local or configured remote host | Selected provider |
| Lifecycle | Editor, CLI, and supporting scripts | Provisioning and connection through DevPod |
| Agent access | Launcher-dependent | SSH offers an entry point for CLI agents |
| Isolation | Runtime, mounts, privileges, and host | Same concerns plus provider infrastructure |
| Parallel tasks | Separate checkouts and containers | Separate named workspaces |
| Tradeoff | Simple local workflow | More placement flexibility and lifecycle configuration |

See [Development Containers](https://containers.dev/), [DevPod architecture](https://devpod.sh/docs/how-it-works/overview), and [remote Docker development](https://code.visualstudio.com/remote/advancedcontainers/develop-remote-host).

## Isolation: tools, work, and authority

### Tool isolation:** different language versions and dependencies.
- **Work isolation:** separate files, branches, databases, and generated output.
- **Security isolation:** deliberate limits on what agent commands can reach.

A container helps with the first. Separate checkouts help with the second. The third requires inspecting effective access. Containers share their container host’s kernel; on Docker Desktop that host is a Linux VM. Privileged mode, host mounts, and Docker daemon access can greatly expand authority. [Docker security](https://docs.docker.com/engine/security/)

My starting point: run as a non-root user, mount only necessary files, avoid the host home directory and Docker socket, limit resources, and review setup hooks before opening unfamiliar repositories. For less trusted code, consider a dedicated disposable VM around the container.

DevPod does not automatically harden a container. Local Docker workspaces still depend on the local runtime; remote VM workspaces add a machine boundary but still need deliberate network and credential controls.

## Credentials are delegated authority

Forwarding a key agent can avoid copying key material while still allowing workspace processes to authenticate. VS Code Dev Containers can reuse local credential helpers and forward a running SSH agent. These are launcher behaviors, not universal properties of the dev container specification. [VS Code credential sharing](https://code.visualstudio.com/remote/advancedcontainers/sharing-git-credentials)

Separate the identity that provisions infrastructure from the credentials supplied to the coding agent.

| Purpose | Intended access |

| Clone source | Read access to one repository |
| Push changes | Repository-scoped write access only when needed |
| Model calls | Separate agent keys with provider-enforced limits |
| Dependencies | Read access to necessary registries |
| Integration tests | Temporary development credentials |
| Deployment | Separate explicitly authorized workflow |

Keep secrets out of committed files, images, and setup scripts. Environment variables remain readable by processes with sufficient access, and may leak into logs. Deleting a workspace does not revoke its credentials.

## Parallel agents need separate state

My default is **one checkout, one container, and one task branch per independently editing agent**.

Separate ports, writable dependency directories, generated outputs, test databases, and volumes too. Two isolated containers can still interfere through the same external database. Git worktrees are useful locally, but linked paths and shared repository metadata complicate remote mounts; independent clones are easier for this starter.

One agent can implement an API, another update a client against an agreed interface, and a later integration workspace can combine their commits. Reviewers should review a fixed commit so their target does not move during the review.

## Concrete starter: two local DevPod workspaces

This example uses Docker and Claude Code as an illustrative CLI agent. The workspace layout also works with other CLI agents after changing installation and authentication. It supplies model access only: no Git push, cloud, registry, or deployment credentials.

**Prerequisites:** Docker running locally, DevPod installed, Git on the host, and two separately issued Anthropic API keys. Use a dedicated provider workspace with a low spending limit and expiring keys where supported. Separate key names improve revocation and attribution; they do not by themselves create separate spending limits. [API key setup](https://platform.claude.com/docs/en/get-api-key)

### 1. Add the environment definition

Save this as `.devcontainer/devcontainer.json` in the project:

```json

  "name": "AI agent starter",
  "image": "mcr.microsoft.com/devcontainers/javascript-node:1-22-bookworm",
  "containerUser": "node",
  "remoteUser": "node",
  "runArgs": [
    "--cap-drop=ALL",
    "--security-opt=no-new-privileges",
    "--cpus=2",
    "--memory=4g",
    "--pids-limit=512"

  "containerEnv": {
    "NPM_CONFIG_PREFIX": "/home/node/.npm-global"

  "postCreateCommand": "npm install --global @anthropic-ai/claude-code",
  "forwardPorts": []

This is a Docker-provider example; other providers may need different resource settings. It defines no extra home-directory or socket mounts and publishes no application ports. It does **not** restrict outbound networking or impose a disk quota. Both agents will need roughly 8 GB of container memory capacity together, plus host overhead.

The non-root npm prefix avoids a privileged installation. Invoke the agent by its full path below. The image tag and CLI installation can change over time: after the first successful run, pin an image digest and an approved CLI version for reproducibility. Package installation and repository lifecycle commands execute code; review them before launch. [Claude Code installation](https://support.claude.com/en/articles/14552382-your-first-day-in-claude-code)

Commit this definition to the source repository before making the clones in step 3, or copy it into both clones before starting them. Do not add secrets to it.

### 2. Disable automatic credential forwarding

On the host:

```sh
devpod provider add docker

devpod context set-options default -o SSH_INJECT_GIT_CREDENTIALS=false
devpod context set-options default -o SSH_INJECT_DOCKER_CREDENTIALS=false
devpod context set-options default -o GPG_AGENT_FORWARDING=false

Add the provider only if it is not already configured. These context options affect other workspaces using the default context too. They disable the documented forwarding features; custom mounts, dotfiles, provider settings, and SSH configuration still need inspection. [DevPod credentials](https://devpod.sh/docs/developing-in-workspaces/credentials)

### 3. Create independent source copies and workspaces

Run on the host, replacing the repository URL:

```sh
mkdir -p "$HOME/agent-workspaces"
cd "$HOME/agent-workspaces"

git clone https://github.com/YOUR-ORG/YOUR-REPO.git agent-a
git clone https://github.com/YOUR-ORG/YOUR-REPO.git agent-b

git -C agent-a switch -c agent/task-a
git -C agent-b switch -c agent/task-b

devpod up ./agent-a --id garden-agent-a --provider docker --ide none
devpod up ./agent-b --id garden-agent-b --provider docker --ide none

For private repositories, authenticate the host-side clones using read-only repository access. Use clean clones: inspect them for tracked secrets and avoid copying `.env`, credential files, or personal dotfiles into them. Local-path handling depends on the provider, so treat both host clones as accessible working data, not backups.

Distinct paths avoid accidentally sharing the same source directory. Distinct workspace IDs keep DevPod’s lifecycle separate. [DevPod workspace creation](https://devpod.sh/docs/developing-in-workspaces/create-a-workspace), [CLI quickstart](https://devpod.sh/docs/quickstart/devpod-cli)

### 4. Connect from two terminals

Terminal A:

```sh
ssh -o ForwardAgent=no garden-agent-a.devpod

Terminal B:

```sh
ssh -o ForwardAgent=no garden-agent-b.devpod

Inside each workspace, confirm the current directory is its project checkout; otherwise `cd` to it. Run:

```sh
id -un
git branch --show-current
git status --short
printf 'SSH agent socket: %s\n' "${SSH_AUTH_SOCK:-unset}"
test ! -S /var/run/docker.sock && echo 'No default Docker socket'

Expect user `node`, the appropriate task branch, no forwarded SSH agent socket, and no default Docker socket. These are spot checks, not proof of complete isolation. If they disagree, inspect configuration before supplying credentials. Also review effective mounts and privileges from the host.

### 5. Supply one model key per agent session

In each workspace, start Bash and run this block. Paste agent A’s key in terminal A and agent B’s key in terminal B:

```sh
bash

  set +x
  read -r -s -p 'Agent API key: ' ANTHROPIC_API_KEY
  printf '\n'
  export ANTHROPIC_API_KEY
  /home/node/.npm-global/bin/claude

The prompt hides input and keeps the key out of shell command history. The subshell drops its environment when the agent exits; the agent and its child processes can still read the key while running. This does not prevent the agent from writing it to disk or transmitting it. Provider-enforced limits and later revocation remain necessary.

Give each agent a bounded task and acceptance checks. Keep normal command approvals enabled; do not add permission-bypass flags. The agents can make local commits without Git authentication. Push only through a reviewed host workflow, or deliberately add a narrowly scoped credential if that becomes necessary.

### 6. Review and clean up

Before deleting anything, locate each workspace’s actual checkout, review its changes, and export commits or patches to a durable location. Do not assume changes were synchronized back to the original host clone.

Then, on the host:

```sh
devpod stop garden-agent-a
devpod stop garden-agent-b

# Only after changes have been preserved:
devpod delete garden-agent-a
devpod delete garden-agent-b

Revoke both API keys and check for retained volumes, source clones, logs, and provider resources. Stop preserves a workspace for later; deletion is the destructive cleanup step. See [stopping workspaces](https://devpod.sh/docs/developing-in-workspaces/stop-a-workspace) and [deleting workspaces](https://devpod.sh/docs/developing-in-workspaces/delete-a-workspace).

## First experiment

Run one bounded task in the local dev container, repeat it through DevPod, and then try two independent tasks concurrently. Record setup time, permission interruptions, dependency failures, test results, supervision effort, and cleanup cost.

The starter above is documentation checked against vendor references, not a locally executed deployment. Validate the effective environment with your installed versions before using it for sensitive work.

## Questions still growing

- Which agent integrations work reliably through SSH?
- When does each task need a dedicated VM?
- How should parallel agents share read-only caches?
- How can effective permissions be inspected before launch?
- What state should survive workspace deletion?
- Does concurrency save time after integration and review?

## Possible connections

- Reproducible development environments
- AI agent permissions
- Ephemeral infrastructure
- Git worktrees for parallel agents
- Development environments as code
- Credentials as delegated authority
