import { BeforeInsert, Column, Entity, PrimaryGeneratedColumn, Tree, TreeChildren, TreeParent } from 'typeorm';
import { hash } from 'bcrypt';
import { UserRoleEnum } from './types/userRole.enum';

@Entity({ name: 'users' })
@Tree("closure-table", {
   closureTableName: "users",
   ancestorColumnName: (column) => "ancestor_" + column.propertyName,
   descendantColumnName: (column) => "descendant_" + column.propertyName,
})
export class UserEntity {
   @PrimaryGeneratedColumn()
   id: number

   @Column()
   name: string

   @Column()
   email: string

   @Column({ select: false })
   password: string

   @Column({ type: 'enum', enum: UserRoleEnum, default: UserRoleEnum.User })
   role: UserRoleEnum

   @BeforeInsert()
   async hashPassword() {
      this.password = await hash(this.password, 10);
   }

   @TreeChildren()
   subordinates: UserEntity[]

   @TreeParent()
   boss: UserEntity | null
}
