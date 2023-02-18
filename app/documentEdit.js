export function appendHeading(element) {
    const heading = document.createElement("h1")
    heading.classList.add("line")
    heading.textContent = "PUNCH_CARDS"
    element.append(heading)
    return heading
}

export function appendButton(element, text, callback) {
    const button = document.createElement('div')
    button.classList.add('button')
    button.classList.add('clickable')
    button.textContent = text
    button.addEventListener("click", () => callback())
    element.append(button)
    return button
}

export function appendLine(element, text) {
    const message = document.createElement('div')
    message.classList.add('line')
    message.append(text)
    element.append(message)
    return message
}

export function clear(element) {
    element.innerHTML = ""
}
