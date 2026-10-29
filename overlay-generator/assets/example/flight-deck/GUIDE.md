# Flight MK-21 · your overlay pack

Hi Mika! This pack turns every stream into a flight: chat are passengers, subs get a boarding pass, deaths are turbulence and the subathon is fuel. Setting it up takes about 5 minutes, once.

> **Before anything else:** double-click **preview.html**. Everything works there without OBS: press the panel buttons and watch the overlay react.

## 1. Put the folder somewhere permanent

Unzip the pack to a folder that won't move, for example `C:\Overlays\mika-flight-deck`.
Not in Downloads, not inside the zip, not in OneDrive or Dropbox. OBS keeps pointing at this folder.

## 2. Turn on the OBS WebSocket

1. In OBS: **Tools → WebSocket Server Settings**.
2. Tick **Enable WebSocket server**.
3. Click **Show Connect Info** and copy the **Server Password**.
4. Click **OK**.

## 3. Add the panel to OBS

1. **Docks → Custom Browser Docks…**
2. Name: `MK-21 panel`. URL: the address of **panel.html** in your folder, for example `file:///C:/Overlays/mika-flight-deck/panel.html`
3. Click **Apply**. Drag the dock wherever you like.

## 4. Connect and install

In the panel, open **Setup**, paste the password, click **Connect**, then **⚙ Install / repair in OBS**.
It creates 5 scenes (Boarding, In flight, Lounge, Delayed, Landed) with every piece already placed. Each piece is its own source (for example **In flight** has *Camera frame*, *Flight strip* and *Alerts*), so you can **drag and resize any of them** in OBS. Clicking Install / repair again keeps your changes.

Then, in each scene, add your camera and your game **below** the overlay:

- **In flight**: the camera goes in the gate monitor at the top right (402 × 236).
- **Lounge**: the camera fills the big frame on the left (1232 × 694).

## 5. Hotkeys (so you never leave the game)

In OBS: **Settings → Hotkeys**, find the entries that start with **⌨ MK-21** and put a key on **Show** (leave Hide empty):

| Key | Does |
|---|---|
| F9 | +1 turbulence |
| F10 | Final approach on/off (holds alerts during a boss) |
| F8 | Next stop |
| F12 | Undo turbulence |

If a game in exclusive fullscreen ignores the key, switch it to borderless window.

## 6. Chat commands for your crew (mods)

Type your channel in the panel's **Chat** tab and click **Listen**.

| Command | Who | Does |
|---|---|---|
| `!turb` | mods | +1 turbulence |
| `!approach` | mods | final approach on/off |
| `!next` | mods | next stop |
| `!refuel` | only you | +5:00 fuel |

## 7. Every stream

- Click **New flight** in the panel before going live: turbulence, stops and the passenger manifest start from zero.
- **Keep the panel open while you stream** (you can minimise it). If it closes, the overlay keeps the last numbers and shows a small "Panel closed" note, so your chat can tell you.
- Subs, gifts and bits add fuel and seats on their own.

## Want changes?

Send Claude the **pack.json** from this folder and ask: "add a boss counter", "make the turbulence louder"… Unzip the new pack over this folder: your counters stay.
