---
title: Is there a way to completely disable Mac OS X Dock?
source: https://apple.stackexchange.com/questions/59556/is-there-a-way-to-completely-disable-dock
author:
  - [[Everett                    3]]
  - [[17055 gold badges2424 silver badges2828 bronze badges]]
  - [[Geoff Pointer–                         Geoff Pointer]]
  - [[Everett–                         Everett]]
  - [[Robino–                         Robino]]
  - [[Janac Meena–                         Janac Meena]]
  - [[robmathers                    42k77 gold badges8989 silver badges120120 bronze badges]]
  - [[theherk–                         theherk]]
  - [[Christian Long                    1]]
  - [[36122 gold badges88 silver badges66 bronze badges]]
published: 2012-08-05
tags:
  - clippings
  - macosx
  - commands
slug: is-there-a-way-to-completely-disable-dock
created: 2026-02-04T00:00:00+0000
updated: 2026-03-22T12:57:02-0400
description: I want the Dock completely gone.  I haven't used it in the past three releases of OS X (10.5 to present).  I want it completely gone, and LaunchBar there instead.  Is there a way to kill the Dock s...
---

# Is there a way to completely disable Dock?

```shell
# Hide Dock
defaults write com.apple.dock autohide -bool true && killall Dock
defaults write com.apple.dock autohide-delay -float 1000 && killall Dock
defaults write com.apple.dock no-bouncing -bool TRUE && killall Dock 

# Restore Dock
defaults write com.apple.dock autohide -bool false && killall Dock
defaults delete com.apple.dock autohide-delay && killall Dock
defaults write com.apple.dock no-bouncing -bool FALSE && killall Dock
```