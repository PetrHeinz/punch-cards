export const CARDS = [
    {
        icon: "👊",
        name: "Punch card",
        count: 6,
        getAction: punchAction(),
    },
    {
        icon: "👆",
        name: "Up",
        count: 3,
        getAction: moveAction(-1),
    },
    {
        icon: "👆👆",
        name: "Uup",
        count: 2,
        getAction: moveAction(-2),
    },
    {
        icon: "👆👆👆",
        name: "Uuup",
        count: 1,
        getAction: moveAction(-3),
    },
    {
        icon: "👇",
        name: "Down",
        count: 3,
        getAction: moveAction(1),
    },
    {
        icon: "👇👇",
        name: "Doown",
        count: 2,
        getAction: moveAction(2),
    },
    {
        icon: "👇👇👇",
        name: "Dooown",
        count: 1,
        getAction: moveAction(3),
    },
    {
        icon: "💥",
        name: "Charge",
        count: 2,
        getAction: getCharge(),
    },
];

export const BLANK_CARD = {
    icon: "📄",
    name: "Blank",
    getAction: () => ({
        prepare: () => {},
        do: () => {},
        cleanup: () => {},
    })
}

function moveAction(amount) {
    return (hand) => ({
        prepare: () => {
            hand.position += amount
        },
        do: () => {
        },
        cleanup: () => {
        },
    })
}

function punchAction() {
    return (hand, thisRobot, otherRobot) => ({
        prepare: () => {
            hand.isBlocking = false
            hand.isAttacking = true
        },
        do: () => {
            const baseDamage = 10;
            const blockedDamage = 8;
            const blockingHandsCount = otherRobot.getHandsBlockingAt(hand.position).length;
            hand.isBlocked = blockingHandsCount > 0
            const damage = Math.max(0, baseDamage - blockingHandsCount * blockedDamage)
            otherRobot.getBodypartAt(hand.position).health -= hand.isCharged ? 3 * damage : damage
        },
        cleanup: () => {
            hand.isBlocked = false
            hand.isBlocking = true
            hand.isAttacking = false
            hand.isCharged = false
        },
    })
}

function getCharge() {
    return (hand) => ({
        prepare: () => {
            hand.isBlocking = false
            hand.isCharged = true
        },
        do: () => {
        },
        cleanup: () => {
        },
    })
}