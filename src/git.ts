import * as Git from 'nodegit'
import * as path from 'path'

const { Repository, Reference } = Git

const run = async () => {
  const repo = await Repository.open(path.join(__dirname, '..'))
  const branch = await repo.getCurrentBranch()
  const head = await repo.getHeadCommit()
  console.log('current', branch.shorthand(), head.sha())
  const commit = await repo.getMasterCommit()
  const refNames = await repo.getReferenceNames(Reference.TYPE.LISTALL)
  for (const refname of refNames) {
    const ref = await Reference.lookup(repo, refname)
    console.log(
      'ref',
      ref.name(),
      ref.isBranch(),
      ref.isHead(),
      ref.isRemote(),
      ref.isSymbolic()
    )
  }

  console.log('', commit.sha())
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
