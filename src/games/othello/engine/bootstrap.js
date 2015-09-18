    function bootstrap() {
        var GameModule = tck.dev.GameModule;

        // retrieve loading module
        var moduleName = 'othello';
        var module = GameModule.newModule(moduleName);

        // fill module
        module['clazz'] = CustomGame;

        // form to cfg conversion
        module['makeConfiguration'] = function() {
            var colour = $('#tck-form-othello .tck-option-colour').val();
            colour = parseInt(colour, 10);

            return {
                'colour': colour
            };
        };

        // confirm module registration
        GameModule.registerModule(module);
    }

