function monitorDOMObjects() {

    // handlers must be synced with DOM, so .on() instead of .bind()

    // game form "Create" button
    $(document).on('click', '.tck-button-create', function() {
        //var $gameForm = $(this).parents('.tck-form');
        var $gameForm = $('.tck-form');

        // game name parsing relies on correct form id
        var formId = $gameForm.attr('id');
        var idParts = formId.match(/tck-form-(.*)/);
        var gameName = idParts[1];

        // make configuration with form data
        var module = GameModule.getRegisteredModule(gameName);
        var cfg = module.makeConfiguration();
        cfg.game = gameName;

        // create session with global channel
        tck.api.create(cfg);
    });
}

// call this ONCE!
monitorDOMObjects();

