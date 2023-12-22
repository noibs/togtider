anime({
    targets: '.container',
    opacity: ['1%', '0%'],
    duration: 1,
})

anime({
    targets: '.container',
    opacity: ['0%', '100%'],
    translateX: ['-100vw', '0'],
    delay: 200,
    duration: 1000,
    easing: 'spring(1, 80, 15, 5)'
})

/*anime({
    targets: '.trip',
    scale: ['0%', '100%'],
    duration: 300,
    delay: 100,
})*/

anime({
    targets: 'h1',
    skew: ['-40deg', '0deg'],
    delay: 200,
    duration: 5000,
    easing: 'spring(1, 80, 15, 5)'
})

anime({
    targets: '.refresh',
    scale: ['0%', '100%'],
    delay: 500,
    duration: 1000,
})

function removePlaceholder() {
    anime({
        targets: '.delete',
        opacity: ['100%', '0%'],
        duration: 500,
        //easing: 'spring(1, 80, 15, 5)'
        easing: 'easeOutQuad'
    })
}

function animateTime() {
    anime({
        targets: '.tripsContainer',
        opacity: ['0%', '100%'],
        duration: 500,
        //easing: 'spring(1, 80, 15, 5)'
        easing: 'easeOutQuad'
    })
}

function refresh() {

    
    anime({
        targets: '.tripsContainer',
        opacity: ['100%', '0%'],
        duration: 250,
        direction: 'alternate',
        easing: 'easeOutQuad'
        /*update: function(anim) {
            if (anim.progress > 80) {
                var elements = document.querySelectorAll('#trips');
                elements.forEach(function(element) {
                    element.classList.remove('transparent');
                });
            }
        }*/

        //easing: 'spring(1, 80, 15, 5)'
    })

    anime({
        targets: '.refresh i',
        rotate: ['0deg', '720deg'],
        duration: 2000,
        easing: 'spring(1, 80, 15, 5)'
    })
}