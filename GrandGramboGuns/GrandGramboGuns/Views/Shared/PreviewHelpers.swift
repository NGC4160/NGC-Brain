// PreviewHelpers.swift
// Xcode canvas previews for hub + 3D viewer scaffolding.

import SwiftUI

#if DEBUG
struct MainHubView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationStack {
            MainHubView()
        }
        .environmentObject(AppState())
        .environmentObject(SettingsStore())
        .environmentObject(GunLibraryStore())
        .environmentObject(CampaignProgressStore())
        .environmentObject(OperatorRosterStore())
        .environmentObject(RankProgressStore())
        .environmentObject(CombatCoinStore())
        .environmentObject(FriendsStore())
        .preferredColorScheme(.dark)
    }
}

struct GunSceneView_Previews: PreviewProvider {
    static var previews: some View {
        GunSceneView(
            blueprint: GunBlueprint(
                name: "Preview Lance",
                bodyType: .rifle,
                attachments: [
                    .optic: "optic_scope",
                    .muzzle: "muzzle_brake",
                    .stock: "stock_solid",
                    .magazine: "mag_extended"
                ],
                premadeSkin: .desertTan
            ),
            allowsCameraControl: true
        )
        .ignoresSafeArea()
        .preferredColorScheme(.dark)
    }
}
#endif
