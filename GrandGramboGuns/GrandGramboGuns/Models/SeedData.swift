// SeedData.swift
// Starter toy guns inserted on first launch.

import Foundation

enum SeedData {
    static func starterGuns() -> [SavedGun] {
        [
            SavedGun(
                name: "Street Sparrow",
                bodyType: .pistol,
                attachments: [
                    .optic: "optic_reddot",
                    .magazine: "mag_std",
                    .muzzle: "muzzle_comp"
                ],
                premadeSkin: .matteBlack,
                isStarter: true
            ),
            SavedGun(
                name: "Neon Hornet",
                bodyType: .smg,
                attachments: [
                    .optic: "optic_holo",
                    .grip: "grip_vertical",
                    .stock: "stock_fold",
                    .magazine: "mag_drum",
                    .underbarrel: "ub_laser"
                ],
                premadeSkin: .neon,
                isStarter: true
            ),
            SavedGun(
                name: "Desert Lance",
                bodyType: .rifle,
                attachments: [
                    .optic: "optic_scope",
                    .muzzle: "muzzle_brake",
                    .grip: "grip_angled",
                    .stock: "stock_solid",
                    .magazine: "mag_extended",
                    .underbarrel: "ub_rail"
                ],
                premadeSkin: .desertTan,
                isStarter: true
            ),
            SavedGun(
                name: "Boom Box",
                bodyType: .shotgun,
                attachments: [
                    .muzzle: "muzzle_flash",
                    .stock: "stock_solid",
                    .magazine: "mag_std",
                    .underbarrel: "ub_light"
                ],
                premadeSkin: .oliveDrab,
                isStarter: true
            )
        ]
    }
}
