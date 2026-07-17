# Short Video Detectors

Detecting when a user is specifically watching short-form videos (Reels, Shorts, TikTok) rather than general app usage requires platform-specific heuristics.

## Android (Accessibility Service)
We use `AccessibilityService` to inspect the view hierarchy of foregrounded target apps.

### Instagram Reels
- **Signature**: `androidx.viewpager2.widget.ViewPager2` containing a `FrameLayout` taking up the entire screen, often with resource ID `reel_viewer_root`.
- **Action**: When this hierarchy is active, we accrue time to the `INSTAGRAM_REELS` counter.

### YouTube Shorts
- **Signature**: `android.support.v7.widget.RecyclerView` inside a parent with resource ID `shorts_player_container`.
- **Action**: Accrue time to `YOUTUBE_SHORTS`.

### TikTok
- **Signature**: The entire app is essentially a short video feed. We track total foreground time of `com.zhiliaoapp.musically`.

## iOS
iOS does not allow View Hierarchy inspection of other apps. 
- **Workaround**: We use `NEDNSProxyProvider` to inspect DNS queries to known short-video CDNs, or we rely on the user voluntarily applying the generic App Limit to the host application via Family Controls.
