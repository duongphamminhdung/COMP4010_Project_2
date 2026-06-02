import { publish } from 'gh-pages';
import fs from 'fs';
import path from 'path';

publish('dist', {
  dotfiles: true,
  beforeAdd(git) {
    const gitignore = path.join(git.cwd, '.gitignore');
    if (fs.existsSync(gitignore)) {
      fs.unlinkSync(gitignore);
    }
    return git.exec('add', '-f', '.');
  },
})
  .then(() => console.log('Published'))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
