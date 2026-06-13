---
class: note
tags:
  - macosx/utility
source: https://chatgpt.com/share/69a08f7c-6f70-8013-9215-b34c35812e95
related: []
aliases: []
feature: attachments/Screenshot 2026-02-26 at 12.38.01 PM.png
thumbnail: thumbnails/resized/e52fe21bca30fd1d82189a20be17bed8_86cf658e.webp
title: How To Modify Command M To Restore Windows
slug: how-to-modify-command-m-to-restore-windows
created: 2026-02-26T13:21:00-0500
updated: 2026-06-12T13:25:00-0500
---

# How to modify Command + M to restore windows
I recently [removed my Dock from Mac OS X](/is-there-a-way-to-completely-disable-dock) and restoring windows became a bit of a hassle. With this script in Karabiner Elements, you can make `Command + M` work as a toggle. You will also need to allow Karabiner access in the settings for accessibility. It will ask you when you first try the shortcut after adding it.

```json
{
  "description": "Command+M toggles minimize/restore",
  "manipulators": [
    {
      "type": "basic",
      "from": {
        "key_code": "m",
        "modifiers": {
          "mandatory": ["command"],
          "optional": ["any"]
        }
      },
      "to": [
        {
          "shell_command": "osascript -e 'tell application \"System Events\" to tell (first application process whose frontmost is true) to tell front window to set value of attribute \"AXMinimized\" to not (value of attribute \"AXMinimized\")'"
        }
      ]
    }
  ]
}
```

![Karabiner Elements Command+M](../../assets/karabiner-elements-command-m.png)