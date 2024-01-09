// Prepares container for animation
anime({
    targets: '.container',
    opacity: ['1%', '0%'],
    duration: 1,
})

// Animates main container
anime({
    targets: '.container',
    opacity: ['0%', '100%'],
    translateX: ['-100vw', '0'],
    delay: 200,
    duration: 1000,
    easing: 'spring(1, 80, 15, 5)'
})

// Title animation
anime({
    targets: 'h1',
    skew: ['-40deg', '0deg'],
    delay: 200,
    duration: 5000,
    easing: 'spring(1, 80, 15, 5)'
})

// Refresh button loading animation
anime({
    targets: '.refresh',
    scale: ['0%', '100%'],
    delay: 500,
    duration: 1000,
})

// Removes placeholders smoothly
function removePlaceholder() {
    anime({
        targets: '.delete',
        opacity: ['100%', '0%'],
        duration: 500,
        //easing: 'spring(1, 80, 15, 5)'
        easing: 'easeOutQuad'
    })
}

// Fades data in
function animateTime() {
    anime({
        targets: '.tripsContainer',
        opacity: ['0%', '100%'],
        duration: 500,
        //easing: 'spring(1, 80, 15, 5)'
        easing: 'easeOutQuad'
    })
}

// Refresh animation
function refresh() {
    anime({
        targets: '.tripsContainer',
        opacity: ['100%', '0%'],
        duration: 250,
        direction: 'alternate',
        easing: 'easeOutQuad'
    })
}

// Refresh hide animation
function hide() {
    anime({
        targets: '.tripsContainer',
        opacity: ['100%', '0%'],
        duration: 125,
        easing: 'easeOutQuad'
    })
}

// Refresh show animation
function show() {
    anime({
        targets: '.tripsContainer',
        opacity: ['0%', '100%'],
        duration: 125,
        easing: 'easeOutQuad'
    })
}

// Refresh button loading animation
function refreshIcon() {
    anime({
        targets: '.refresh i',
        rotate: ['0deg', '930deg'],
        duration: 1000,
        easing: 'easeOutQuart'
        //easing: 'spring(1, 80, 15, 5)'
        
    })
}

// Swap button animation
function swapAnim() {
    anime({
        targets: '#swap',
        scale: ['100%', '90%'],
        duration: 150,
        direction: 'alternate',
        easing: 'easeOutQuad'
    })
}