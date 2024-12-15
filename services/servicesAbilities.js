const { AbilityBuilder, Ability } = require('@casl/ability');

function defineAbilitiesFor(user) {
    const { can, rules } = new AbilityBuilder(Ability);
    
    if (user) {
        if (user.role === '0') { // 0 - user
            can('read', 'Masters');
            can('read', 'Masters', { id: user.id }); // Просмотр отдельного мастера по его id
            can('read', 'Types');
            can('read', 'Enrollment');
            can('create', 'Enrollment');
            can('read', 'Scheduler');
            
        } else if (user.role === '1') { // 1 - admin
            can('manage', 'all');
            cannot('create', 'Enrollment');
        }
    } else {
        can('read', 'Masters');
        can('read', 'Types');
        can('read', 'Scheduler');
        can('read', 'Enrollment');
        can('create', 'Enrollment');
    }
    
    return new Ability(rules);
}
