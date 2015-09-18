    function bootstrap() {
        var GameModule = tck.dev.GameModule;

        // retrieve loading module
        var moduleName = 'chess';
        var module = GameModule.newModule(moduleName);

        // fill module
        module['clazz'] = CustomGame;

        // form to cfg conversion
        module['makeConfiguration'] = function() {
            var colour = $('#tck-form-chess .tck-option-colour').val();
            colour = parseInt(colour, 10);

            // TODO: validate
            //var limit = $('#tck-form-chess .tck-option-limit').val();
            //limit = parseInt(limit, 10);

            return {
                'colour': colour,
                //'limit': limit // FIXME: broken timer
                'limit': 0
            };
        };

        // confirm module registration
        GameModule.registerModule(module);
    }

