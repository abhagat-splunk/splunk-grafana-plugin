import os
import sys
path_to_add = "/public/plugins/xynazog-splunk-datasource/"
walk_dir = os.getcwd()+"/node_modules"

print('walk_dir = ' + walk_dir)

# If your current working directory may change during script execution, it's recommended to
# immediately convert program arguments to an absolute path. Then the variable root below will
# be an absolute path as well. Example:
# walk_dir = os.path.abspath(walk_dir)
print('walk_dir (absolute) = ' + os.path.abspath(walk_dir))

for root, subdirs, files in os.walk(walk_dir):
    print('--\nroot = ' + root)
    # for subdir in subdirs:
    #     print('\t- subdirectory ' + subdir)

    for filename in files:
        file_path = os.path.join(root, filename)
        if filename[-2:]=="js":
            print('\t- JS file %s (full path: %s)' % (filename, file_path))
            g = open("temp.js",'w')
            with open(file_path, 'r') as f:
                f_content = f.readlines()
                for temp_line in f_content:
                    l = temp_line
                    #print(l.strip())
                    if "require('" in l:
                        #print(l.strip())
                        req_start = 'require("'
                        req_end = '")'
                        if req_start in l and req_end in l:
                            req_start_ind = l.index(req_start)+len(req_start)
                            req_end_ind = l.index(req_end)
                            module_name = l[req_start_ind:req_end_ind]
                            print ("Module Name: {}".format(module_name))
                            if len(module_name)>0 and (module_name[0]!='.' and module_name[0]!='/'):
                                l = l.replace(req_start+module_name+req_end,req_start+path_to_add+module_name+req_end)
                        print(l.strip())
                    elif 'require("' in l:
                        #print(l.strip())
                        req_start = 'require("'
                        req_end = '")'
                        if req_start in l and req_end in l:
                            req_start_ind = l.index(req_start)+len(req_start)
                            req_end_ind = l.index(req_end)
                            module_name = l[req_start_ind:req_end_ind]
                            print ("Module Name: {}".format(module_name))
                            if len(module_name)>0 and (module_name[0]!='.' and module_name[0]!='/'):
                                l = l.replace(req_start+module_name+req_end,req_start+path_to_add+module_name+req_end)       
                    g.write(l)
                g.close()
                f.close()
                with open("temp.js",'r') as g:
                    g_content = g.readlines()
                    f = open(file_path,'w')
                    for l in g:
                        f.write(l)
                    f.close()
                    g.close()

        #     list_file.write(('The file %s contains:\n' % filename).encode('utf-8'))
        #     list_file.write(f_content)
        #     list_file.write(b'\n')

